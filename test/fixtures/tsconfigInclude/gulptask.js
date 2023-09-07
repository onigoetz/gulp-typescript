const gulp = require("gulp");

module.exports = function(newTS, lib, output, reporter) {
  var tsProject = newTS.createProject(
    "test/fixtures/tsconfigInclude/tsconfig.json",
    {
      typescript: lib
    }
  );

  var tsResult = tsProject
    .src()
    .pipe(tsProject(reporter))
    .on("error", () => {});

  return tsResult.pipe(gulp.dest(output));
};

module.exports.expectFiles = ["out.js"];
