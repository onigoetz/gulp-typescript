const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");

module.exports = (newTS, lib, output, reporter) => {
	const project = newTS.createProject(
		"test/fixtures/sourceMapsOutDir/src/tsconfig.json",
		{
			typescript: lib,
		},
	);

	return project
		.src()
		.pipe(sourcemaps.init())
		.pipe(project(reporter))
		.on("error", () => {})
		.js.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(`${output}js/dist`));
};

module.exports.expectFiles = [
	"js/dist/main.js",
	"js/dist/main.js.map",
	"js/dist/sub/second.js",
	"js/dist/sub/second.js.map",
];
