const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const mergeStream = require("../../merge");

module.exports = function (newTS, lib, output, reporter) {
	const project = newTS.createProject(
		"test/fixtures/tsconfigProjectReferences/b/tsconfig.json",
		{
			typescript: lib,
		},
	);

	const tsResult = project
		.src()
		.pipe(sourcemaps.init())
		.pipe(project(reporter))
		.on("error", () => {});

	return mergeStream(
		tsResult.dts.pipe(sourcemaps.write(".")).pipe(gulp.dest(`${output}/dts`)),
		tsResult.js.pipe(sourcemaps.write(".")).pipe(gulp.dest(`${output}js`)),
	);
};

module.exports.match = function (lib) {
	const match = /^(\d+)(?=\.)/.exec(lib.version);
	return !!match && parseInt(match[0], 10) >= 3;
};

module.exports.expectFiles = [
	"dts/b.d.ts",
	"dts/b.d.ts.map",
	"js/b.js",
	"js/b.js.map",
];
