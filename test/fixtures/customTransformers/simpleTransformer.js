const ts = require('typescript');

function simpleTransformer() {
    return function (file) {
        return ts.factory.updateSourceFile(file, []);
    }
}

module.exports = simpleTransformer;
