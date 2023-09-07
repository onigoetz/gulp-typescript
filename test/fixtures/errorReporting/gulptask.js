const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const mergeStream = require("../../merge");

module.exports = function(newTS, lib, output, reporter) {
  var tsResult = gulp
    .src("test/fixtures/errorReporting/*.ts")
    .pipe(sourcemaps.init())
    .pipe(newTS.compile({ typescript: lib }, reporter))
    .on("error", () => {});

  return mergeStream(
    tsResult.dts.pipe(gulp.dest(`${output}/dts`)),
    tsResult.js
      .pipe(
        sourcemaps.write(".", {
          includeContent: false,
          sourceRoot: "../../../../errorReporting/"
        })
      )
      .pipe(gulp.dest(`${output}js`))
  );
};

module.exports.expectFiles = ["js/test-4.js", "js/test-4.js.map"];
