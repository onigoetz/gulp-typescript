const gulp = require("gulp");
const mergeStream = require("../../merge");

module.exports = function(newTS, lib, output, reporter) {
  const tsResult = gulp
    .src("test/fixtures/emitDeclarationOnly/**/*.ts")
    .pipe(
      newTS.compile(
        { declaration: true, emitDeclarationOnly: true, typescript: lib },
        reporter
      )
    )
    .on("error", () => {});

  return mergeStream(
    tsResult.dts.pipe(gulp.dest(`${output}/dts`)),
    tsResult.js.pipe(gulp.dest(`${output}js`))
  );
};

module.exports.match = function(lib) {
  // emitDeclarationOnly was added in TypeScript 2.8.
  const match = /^(\d+)\.(\d+)/.exec(lib.version);
  if (!match) return false;
  const major = parseInt(match[0], 10);
  const minor = parseInt(match[1], 10);
  return major > 2 || (major === 2 && minor >= 8);
};

module.exports.expectFiles = ["dts/a.d.ts"];
