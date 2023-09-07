## 6.0.0

- The default export is no longer a function
  - When importing `const ts = require("gulp-typescript")` you now need to do `ts.compile()` instead of `ts()`
- Test with TypeScript 5
- Support `mts` and `mjs` extensions