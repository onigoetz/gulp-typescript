const gulp = require("gulp");
var concat = require("gulp-concat");
var sourcemaps = require("gulp-sourcemaps");

module.exports = function(newTS, lib, output, reporter) {
  return gulp
    .src("test/fixtures/existingSourceMaps/*.ts")
    .pipe(sourcemaps.init())
    .pipe(concat("all.ts"))
    .pipe(
      newTS.compile(
        { typescript: lib, declaration: true, declarationMap: true },
        reporter
      )
    )
    .on("error", () => {})
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(output));
};

module.exports.expectFiles = [
  "all.d.ts",
  "all.d.ts.map",
  "all.js",
  "all.js.map"
];
