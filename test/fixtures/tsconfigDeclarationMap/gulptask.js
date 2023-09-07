const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const mergeStream = require("../../merge");

module.exports = function (newTS, lib, output, reporter) {
	const project = newTS.createProject(
		"test/fixtures/tsconfigDeclarationMap/src/tsconfig.json",
		{
			typescript: lib,
			declarationMap: true,
		},
	);

	const tsResult = project
		.src()
		.pipe(sourcemaps.init())
		.pipe(project(reporter))
		.on("error", () => {});

	return mergeStream(
		tsResult.dts.pipe(sourcemaps.write(".")).pipe(gulp.dest(`${output}/dts`)),
		tsResult.js.pipe(gulp.dest(`${output}js`)),
	);
};

module.exports.expectFiles = [
	"dts/outFile.d.ts",
	"dts/outFile.d.ts.map",
	"js/outFile.js",
];
