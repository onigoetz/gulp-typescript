const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");

module.exports = (newTS, lib, output, reporter) => {
	const project = newTS.createProject(
		"test/fixtures/tsconfigOutFile/src/tsconfig.json",
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
		.pipe(gulp.dest(`${output}js`));
};

module.exports.expectFiles = ["js/outFile.js", "js/outFile.js.map"];
