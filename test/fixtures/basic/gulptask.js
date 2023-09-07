const gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
const mergeStream = require("../../merge");

module.exports = function(newTS, lib, output, reporter) {
  var tsProject = newTS.createProject("test/fixtures/basic/tsconfig.json", {
    typescript: lib
  });

  var tsResult = tsProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(tsProject(reporter))
    .on("error", () => {});

  return mergeStream(
    tsResult.dts.pipe(gulp.dest(`${output}/dts`)),
    tsResult.js
      .pipe(sourcemaps.write(".", { sourceRoot: "../../../../basic/" }))
      .pipe(gulp.dest(`${output}js`))
  );
};

module.exports.expectFiles = [
  "dts/other-3.d.ts",
  "dts/test-3.d.ts",
  "js/other-3.js",
  "js/other-3.js.map",
  "js/test-3.js",
  "js/test-3.js.map"
];
