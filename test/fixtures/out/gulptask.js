const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const mergeStream = require("../../merge");

module.exports = function (newTS, lib, output, reporter) {
	const tsResult = gulp
		.src("test/fixtures/out/*.ts")
		.pipe(sourcemaps.init())
		.pipe(
			newTS.compile(
				{
					declarationFiles: true,
					outFile: "concat.js",
					typescript: lib,
					target: "es6",
					types: [],
				},
				reporter,
			),
		)
		.on("error", () => {});

	return mergeStream(
		tsResult.dts.pipe(gulp.dest(`${output}/dts`)),
		tsResult.js
			.pipe(sourcemaps.write(".", { sourceRoot: "../../../../out/" }))
			.pipe(gulp.dest(`${output}/js`)),
	);
};

module.exports.expectFiles = [
	"dts/concat.d.ts",
	"js/concat.js",
	"js/concat.js.map",
];
