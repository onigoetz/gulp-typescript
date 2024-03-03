const gulp = require("gulp");
const mergeStream = require("../../merge");

module.exports = (newTS, lib, output, reporter) => {
	const tsProject = newTS.createProject("test/fixtures/base/tsconfig.json", {
		typescript: lib,
	});

	const tsResult = tsProject
		.src()
		.pipe(tsProject(reporter))
		.on("error", () => {});

	return mergeStream(
		tsResult.dts.pipe(gulp.dest(`${output}/dts`)),
		tsResult.js.pipe(gulp.dest(`${output}js`)),
	);
};

module.exports.expectFiles = ["js/a.js"];
