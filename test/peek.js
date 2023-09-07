const { compose } = require("stream");

function peek(prefix) {
	return compose(async function* (source) {
		for await (const chunk of source) {
			console.log(
				prefix,
				`'${chunk.basename}'`,
				`'${chunk.contents.toString().substring(0, 20)}...'`,
			);
			yield chunk;
		}
	});
}

module.exports = peek;
