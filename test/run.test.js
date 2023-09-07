const test = require("ava");
const childProcess = require("child_process");
const { finished } = require("node:stream/promises");
const fs = require("fs");
const path = require("path");
const tmp = require("tmp");

const util = require("util");

const tmpDir = util.promisify(tmp.dir);

const tsVersions = {
  current: "typescript"
  // TODO :: add more typescript versions
  //release36: './typescript/3.6'
};

const libs = {
  //['3.6', require(tsVersions.release36)],
  current: require(tsVersions.current)
};

const tests = fs.readdirSync(path.join(__dirname, "fixtures"));

// Some issues with path computations can only be detected with
// `gulp-typescript` running in a process that has a specific cwd. In the test
// suite, such tests have a `gulpfile.js` in their top directory.
const execTests = tests.filter(dir => {
  const fullPath = path.join(__dirname, "fixtures", dir, "gulpfile.js");
  try {
    fs.accessSync(fullPath);
    return true;
  } catch (ex) {
    if (ex.code !== "ENOENT") {
      throw ex;
    }
    return false;
  }
});

function getAllFiles(dirPath, inputFiles = []) {
  const files = fs.readdirSync(dirPath);

  let arrayOfFiles = inputFiles;

  for (const file of files) {
    const newPath = path.join(dirPath, file);
    if (fs.statSync(newPath).isDirectory()) {
      arrayOfFiles = getAllFiles(newPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(newPath);
    }
  }

  return arrayOfFiles;
}

async function runExecTest(testName, t) {
  const testDir = path.posix.join(__dirname, "fixtures", testName);

  return new Promise((resolve, reject) => {
    childProcess.exec(
      "gulp",
      {
        cwd: testDir
      },
      err => {
        if (err) {
          reject(err);
        }
        // Run succeeded
        t.deepEqual(1, 1);
        resolve();
      }
    );
  });
}

function sanitizeError(err) {
  // File names embedded in error output contain OS-dependent path separators, normalize from Windows to Posix
  if (path.sep === "\\") {
    const colonIndex = err.message.indexOf(":");
    if (
      colonIndex >= 0 &&
      err.diagnostic &&
      err.message.indexOf(path.sep) >= 0
    ) {
      const detail = err.message.slice(colonIndex);
      const fileName = err.message.slice(0, colonIndex).replace(/\\/g, "/");
      err.message = `${fileName}${detail}`;
    }
  }

  return err;
}

function compareFiles(expected, actual, t) {
  const expectedFiles = new Set(expected);
  const actualFiles = new Set(actual);

  const missingFiles = expected.filter(f => !actualFiles.has(f));
  const extraFiles = actual.filter(f => !expectedFiles.has(f));

  if (missingFiles.length === 0 && extraFiles.length === 0) {
    return true;
  }

  let message = "Expected files did not match actual files.";
  if (missingFiles.length > 0) {
    message += ` Could not find: '${missingFiles.join("', '")}'.`;
  }
  if (extraFiles.length > 0) {
    message += ` Should not be present: '${extraFiles.join("', '")}'.`;
  }

  t.fail(message);

  return false;
}

const ROOT = new RegExp(process.cwd().replace(/\//g, "\\/"), "g");

function cleanError(e) {
  return e.toString().replace(ROOT, "ROOT_DIR")
}

/**
 * Runs the tests in the directory `test/${name}/` with all the supported versions of TS
 *
 * This function loads the gulp task from the `gulptask.js` file in the corresponding directory.
 * Then, for each supported Typescript version, it executes it. The result is emitted in the
 * `test/output/${name}/${tsVersion}` directories. It consists of a `dts` directory, `js` directory and
 * `errors.txt`.
 *
 * @param name {string} Name of the test, corresponds to its directory name in `test/`
 */
async function runTest(name, tsVersionName, t) {
  const testDir = path.posix.join("fixtures", name);
  const outputDir = await tmpDir({ prefix: `${name}-${tsVersionName}` });

  const newGulpTs = require("../dist/index");
  const testTask = require(`./${path.posix.join(testDir, "gulptask.js")}`);

  if (testTask.match && !testTask.match(libs[tsVersionName])) {
    // Test skipped, nothing to see here
    t.deepEqual(1, 1);
    return;
  }

  const tsLib = libs[tsVersionName];

  const errors = [];
  let finishInfo;
  const reporter = {
    error(err) {
      errors.push(sanitizeError(err));
    },
    finish(info) {
      finishInfo = info;
    }
  };

  await finished(testTask(newGulpTs, tsLib, `${outputDir}/`, reporter));

  const result = [errors.map(cleanError), finishInfo];
  t.snapshot(result);

  // Make sure we have exactly the files that we are expecting, not more, not less
  const allFiles = getAllFiles(`${outputDir}/`).map(file =>
    file.replace(`${outputDir}/`, "")
  );
  const success = compareFiles(testTask.expectFiles, allFiles, t);

  if (success) {
    // Check all expected files for the right content
    for (const file of testTask.expectFiles) {
      const filePath = path.join(outputDir, file);
      const content = fs.readFileSync(filePath, { encoding: "utf-8" });

      t.snapshot(`${file}\n${content}`);
    }
  }
}

for (const tsVersion of Object.keys(tsVersions)) {
  for (const testName of execTests) {
    test.serial(`${tsVersion}: exec ${testName}`, async t => {
      await runExecTest(testName, t);
    });
  }

  for (const testName of tests) {
    test.serial(`${tsVersion}: run ${testName}`, async t => {
      await runTest(testName, tsVersion, t);
    });
  }
}
