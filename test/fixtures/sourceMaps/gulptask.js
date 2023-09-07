const gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");

module.exports = function(newTS, lib, output, reporter) {
  var project = newTS.createProject(
    "test/fixtures/sourceMaps/Main/tsconfig.json",
    {
      typescript: lib
    }
  );

  return project
    .src()
    .pipe(sourcemaps.init())
    .pipe(project(reporter))
    .on("error", () => {})
    .js.pipe(sourcemaps.write("."))
    .pipe(gulp.dest(`${output}js/Main`));
};

module.exports.expectFiles = [
  "js/Main/MainFile.js",
  "js/Main/MainFile.js.map",
  "js/Main/MainFileTsx.js",
  "js/Main/MainFileTsx.js.map",
  "js/Main/sub/sub.js",
  "js/Main/sub/sub.js.map"
];
