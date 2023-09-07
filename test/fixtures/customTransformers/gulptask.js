const gulp = require("gulp");
const transformer = require("./simpleTransformer");

module.exports = function (newTS, lib, output, reporter) {
	const getCustomTransformers = function () {
		return {
			// This transformer simply clean file contents.
			before: [transformer],
		};
	};
	const tsProject = newTS.createProject(
		"test/fixtures/customTransformers/tsconfig.json",
		{ getCustomTransformers, typescript: lib },
	);

	const tsResult = tsProject
		.src()
		.pipe(tsProject(reporter))
		.on("error", () => {});

	return tsResult.js.pipe(gulp.dest(`${output}js`));
};

module.exports.expectFiles = ["js/test-transformers.js"];
