const gulp = require("gulp");

module.exports = (newTS, lib, output, reporter) => {
	const tsProject = newTS.createProject(
		"test/fixtures/tsconfigInclude/tsconfig.json",
		{
			typescript: lib,
		},
	);

	const tsResult = tsProject
		.src()
		.pipe(tsProject(reporter))
		.on("error", () => {});

	return tsResult.pipe(gulp.dest(output));
};

module.exports.expectFiles = ["out.js"];
