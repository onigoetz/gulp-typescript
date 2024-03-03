const gulp = require("gulp");

module.exports = (newTS, lib, output, reporter) =>
	gulp
		.src("test/fixtures/noEmitOnError/**/*.ts")
		.pipe(
			newTS.compile(
				{ noEmitOnError: true, typescript: lib, outFile: "foo.js" },
				reporter,
			),
		)
		.on("error", () => {})
		.pipe(gulp.dest(output));

module.exports.expectFiles = [];
