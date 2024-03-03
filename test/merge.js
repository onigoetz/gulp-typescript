const { finished } = require("node:stream/promises");

const { Writable } = require("node:stream");

module.exports = (...streams) => {
	const newStream = new Writable({
		objectMode: true,
		write(chunk, encoding, callback) {
			console.log("Wriging to stream");
		},
		writev(chunks, callback) {
			console.log("Wriging to stream v");
		},
	});

	Promise.all(
		streams.map((s) => {
			s.on("error", (e) => {
				console.error("Bubbling error from stream", e);
				newStream.destroy(e);
			});

			return finished(s);
		}),
	).then(
		() => {
			newStream.end();
		},
		(e) => {
			console.error("Failed one promise", e);
			newStream.destroy(e);
		},
	);

	return newStream;
};
