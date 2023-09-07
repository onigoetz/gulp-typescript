const gulp = require("gulp");

module.exports = function (newTS, lib, output, reporter) {
	return gulp
		.src("test/fixtures/noEmit/**/*.ts")
		.pipe(
			newTS.compile(
				{ noEmit: true, typescript: lib, outFile: "foo.js" },
				reporter,
			),
		)
		.on("error", () => {})
		.pipe(gulp.dest(output));
};

module.exports.expectFiles = [];
