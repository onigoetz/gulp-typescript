const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const mergeStream = require("../../merge");

module.exports = (newTS, lib, output, reporter) => {
	const tsProject = newTS.createProject(
		"test/fixtures/typesResolution/sub/tsconfig.json",
		{
			typescript: lib,
		},
	);

	const tsResult = tsProject
		.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject(reporter))
		.on("error", () => {});

	return mergeStream(
		tsResult.dts.pipe(gulp.dest(`${output}/dts`)),
		tsResult.js
			.pipe(sourcemaps.write(".", { sourceRoot: "../../../../basic/" }))
			.pipe(gulp.dest(`${output}js`)),
	);
};

module.exports.expectFiles = [
	"dts/test-3.d.ts",
	"js/test-3.js",
	"js/test-3.js.map",
];
