const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const plumber = require("gulp-plumber");
const mergeStream = require("../../merge");

module.exports = function (newTS, lib, output, reporter) {
	const tsProject = newTS.createProject(
		"test/fixtures/isolatedModules/tsconfig.json",
		{
			typescript: lib,
		},
	);

	const tsResult = tsProject
		.src()
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(tsProject(reporter))
		.on("error", () => {});
	return mergeStream(
		tsResult.dts.pipe(gulp.dest(`${output}/dts`)),
		tsResult.js
			.pipe(
				sourcemaps.write(".", { sourceRoot: "../../../../isolatedModules/" }),
			)
			.pipe(gulp.dest(`${output}js`)),
	);
};

module.exports.expectFiles = [
	"js/other-3.js",
	"js/other-3.js.map",
	"js/test-3.js",
	"js/test-3.js.map",
];
