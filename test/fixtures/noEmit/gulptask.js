const gulp = require("gulp");

module.exports = (newTS, lib, output, reporter) =>
	gulp
		.src("test/fixtures/noEmit/**/*.ts")
		.pipe(
			newTS.compile(
				{ noEmit: true, typescript: lib, outFile: "foo.js" },
				reporter,
			),
		)
		.on("error", () => {})
		.pipe(gulp.dest(output));

module.exports.expectFiles = [];
