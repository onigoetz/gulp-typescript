const gulp = require("gulp");

module.exports = function(newTS, lib, output, reporter) {
  return gulp
    .src("test/fixtures/noEmitOnError/**/*.ts")
    .pipe(
      newTS.compile(
        { noEmitOnError: true, typescript: lib, outFile: "foo.js" },
        reporter
      )
    )
    .on("error", () => {})
    .pipe(gulp.dest(output));
};

module.exports.expectFiles = [];
