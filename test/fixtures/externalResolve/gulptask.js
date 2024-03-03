const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");

const mergeStream = require("../../merge");

module.exports = (newTS, lib, output, reporter) => {
	const tsResult = gulp
		.src("test/fixtures/externalResolve/test-2.ts")
		.pipe(sourcemaps.init())
		.pipe(
			newTS.compile(
				{
					declarationFiles: true,
					module: "commonjs",
					typescript: lib,
				},
				reporter,
			),
		)
		.on("error", () => {});

	return mergeStream(
		tsResult.dts.pipe(gulp.dest(`${output}/dts`)),
		tsResult.js
			.pipe(
				sourcemaps.write(".", { sourceRoot: "../../../../externalResolve/" }),
			)
			.pipe(gulp.dest(`${output}js`)),
	);
};

module.exports.expectFiles = [
	"dts/test-2.d.ts",
	"js/test-2.js",
	"js/test-2.js.map",
];
