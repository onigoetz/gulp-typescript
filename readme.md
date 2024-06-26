gulp-typescript
===============

[![Latest version](https://img.shields.io/github/release/onigoetz/gulp-typescript.svg?style=flat-square)](https://github.com/onigoetz/gulp-typescript/releases)
![License](https://img.shields.io/github/license/onigoetz/gulp-typescript?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/onigoetz/gulp-typescript/nodejs.yml?style=flat-square&logo=github)
[![NPM Downloads](https://img.shields.io/npm/dm/@onigoetz/gulp-typescript?style=flat-square&logo=npm)](https://www.npmjs.com/package/@onigoetz/gulp-typescript)

> This is a fork of `gulp-typescript` which is more up-to-date

A gulp plugin for handling TypeScript compilation workflow. The plugin exposes TypeScript's compiler options to gulp using TypeScript API.

This plugin works best with gulp 4. If you cannot update to this version, please see the section "Gulp 3" below.

Updating from version 2? See the [breaking changes in version 3](http://dev.ivogabe.com/gulp-typescript-3/).

How to install
--------------
##### 1. Install gulp CLI
```shell
npm install --global gulp-cli
```
##### 2. Install gulp in the project dependency
```shell
npm install gulp@4
```
##### 3. Install gulp-typescript & TypeScript
```shell
npm install @onigoetz/gulp-typescript typescript
```

Options
-------
Almost all options from TypeScript are supported.
- `outFile` (string) - Generate one javascript and one definition file. Only works when no module system is used.
- `outDir` (string) - Move output to a different (virtual) directory. Note that you still need `gulp.dest` to write output to disk.
- `noImplicitAny` (boolean) - Warn on expressions and declarations with an implied 'any' type.
- `suppressImplicitAnyIndexErrors` (boolean) - Suppress `--noImplicitAny` errors for indexing objects lacking index signatures.
- `noLib` (boolean) - Don't include the default lib (with definitions for - Array, Date etc)
- `lib` (string[]) - List of library files to be included in the compilation.
- `target` (string) - Specify ECMAScript target version: 'ES3' (default), 'ES5' or 'ES6'.
- `module` (string) - Specify module code generation: 'commonjs', 'amd', 'umd' or 'system'.
- `jsx` (string) - Specify jsx code generation: 'react' or 'preserve' (TS1.6+).
- `declaration` (boolean) - Generates corresponding .d.ts files. You need to pipe the `dts` streams to save these files.
- `removeComments` (boolean) - Do not emit comments to output.
- `emitDecoratorMetadata` (boolean) - Emit design-time metadate for decorated declarations in source.
- `experimentalAsyncFunctions` (boolean) - Support for ES7-proposed asynchronous functions using the `async`/`await` keywords (TS1.6+).
- `experimentalDecorators` (boolean) - Enables experimental support for ES7 decorators.
- `moduleResolution` (string) - Determine how modules get resolved. Either 'node' for Node.js/io.js style resolution, or 'classic' (default) (TS1.6+).
- `noEmitOnError` (boolean) - Do not emit outputs if any type checking errors were reported.
- `noEmitHelpers` (boolean) - Do not generate custom helper functions like __extends in compiled output.
- `preserveConstEnums` (boolean) - Do not erase const enum declarations in generated code. 
- `isolatedModules` (boolean) - Compiles files seperately and doesn't check types, which causes a big speed increase. You have to use gulp-plumber and TypeScript 1.5+.
- `allowJs` (boolean) - Allow JavaScript files to be compiled.
- `rootDir` - Specifies the root directory of input files. Only use to control the output directory structure with `outDir`.

See the [TypeScript wiki](https://www.typescriptlang.org/docs/handbook/compiler-options.html) for a complete list.
These options are not supported:
- Sourcemap options (`sourceMap`, `inlineSourceMap`, `inlineSources`, `sourceRoot`, `declarationMap`) - Use  [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) instead.
- `watch` - Use `gulp.watch` instead. See the paragraph "Incremental compilation".
- `project` - See "Using `tsconfig.json`".
- Obvious: `help`, `version`

API overview
------------
gulp-typescript can be imported using `const ts = require('gulp-typescript');`. It provides the following functions:

- `ts.compile(options?)` - Returns a gulp stream that compiles TypeScript files using the specified options.
- `ts.createProject(options?)`, `ts.createProject(tsconfig filename, options?)` - Returns a project. The intended usage is to create a project outside of a task with `const tsProject = ts.createProject(..);`. Within a task, `tsProject()` can be used to compile a stream of TypeScript files.
- `tsProject.src()` - Returns a stream containing the source files (.ts) from a tsconfig file. It can only be used if you create a project with a `tsconfig.json` file. It is a replacement for `gulp.src(..)`.

Both `ts.compile(..)` and `tsProject()` provide sub-streams that only contain the JavaScript or declaration files. An example is shown later in the readme.

Basic Usage
----------
Below is a minimal `gulpfile.js` which will compile all TypeScript file in folder `src` and emit a single output file called `output.js` in  `built/local`. To invoke, simple run `gulp`.

```javascript
const gulp = require('gulp');
const ts = require('gulp-typescript');

gulp.task('default', function () {
    return gulp.src('src/**/*.ts')
        .pipe(ts.compile({
            noImplicitAny: true,
            outFile: 'output.js'
        }))
        .pipe(gulp.dest('built/local'));
});
```
Another example of `gulpfile.js`. Instead of creating the default task, the file specifies custom named task. To invoke, run `gulp scripts` instead of `gulp`. As a result, the task will generate both JavaScript files and TypeScript definition files (`.d.ts`).
```javascript
const gulp = require('gulp');
const ts = require('gulp-typescript');
const merge = require('merge2');  // Requires separate installation

gulp.task('scripts', function() {
    const tsResult = gulp.src('lib/**/*.ts')
        .pipe(ts.compile({
            declaration: true
        }));

    return merge([
        tsResult.dts.pipe(gulp.dest('release/definitions')),
        tsResult.js.pipe(gulp.dest('release/js'))
    ]);
});
```
`tsResult` is a stream containing the generated JavaScript and definition files.
In many situations, some plugins need to be executed on the JavaScript files.
For these situations, the stream has sub-streams, namely a JavaScript stream (`tsResult.js`) and a definition file stream (`tsResult.dts`). 
You need to set the `declaration` option to generate definition files.
If you don't need the definition files, you can use a configuration as seen in the first example, and you don't need to store the result into a variable as `tsResult`.

Incremental compilation
-----------------------
Instead of calling `ts.compile(options)`, you can create a project first outside of the task. Inside the task, you should then use `tsProject()`. An example:
```javascript
const gulp = require('gulp');
const ts = require('gulp-typescript');
const merge = require('merge2');

const tsProject = ts.createProject({
    declaration: true
});

gulp.task('scripts', function() {
    return gulp.src('lib/*.ts')
        .pipe(tsProject())
        .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['scripts'], function() {
    gulp.watch('lib/*.ts', ['scripts']);
});
```
When you run `gulp watch`, the source will be compiled as usual. Then, when you make a change and save the file, your TypeScript files will be compiled in about half the time.

You must create the project outside of the task. You can't use the same project in multiple tasks.
Instead, create multiple projects or use a single task to compile your sources. Usually it is not worth to create different tasks for the client side, backend or tests.

Using `tsconfig.json`
-------------
To use `tsconfig.json`, you have to use `ts.createProject`:
```javascript
const tsProject = ts.createProject('tsconfig.json');
```
If you want to add or overwrite certain settings in the `tsconfig.json` file, you can use:
```javascript
const tsProject = ts.createProject('tsconfig.json', { noImplicitAny: true });
```
The task will look like:
```javascript
gulp.task('scripts', function() {
    const tsResult = gulp.src("lib/**/*.ts") // or tsProject.src()
        .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('release'));
});
```

You can replace `gulp.src(...)` with `tsProject.src()` to load files based on the tsconfig file (based on `files`, `excludes` and `includes`).

TypeScript version
------------------
gulp-typescript isn't restricted to a single TypeScript version.
You can install the latest stable version using `npm install typescript --save-dev` or a nightly `npm install typescript@next --save-dev`.

You can also use a fork of TypeScript, if it is based on TypeScript 2.x. You can configure this in your gulpfile:
```javascript
[...].pipe(ts.compile({
    typescript: require('my-fork-of-typescript')
}));
```
Or in combination with a `tsconfig` file:
```javascript
const tsProject = ts.createProject('tsconfig.json', {
    typescript: require('my-form-of-typescript')
});
```

Source maps
----------
gulp-typescript supports source maps by the usage of the gulp-sourcemaps plugin. It works for both JavaScript and definition (`.d.ts`) files. You don't have to set `sourceMap` or `declarationMap` in your configuration. When you use gulp-sourcemaps, they will be generated automatically.

Configuring the paths of source maps can be hard. The easiest way to get working source maps is to inline the sources of your TypeScript files in the source maps. This will of course increase the size of the source maps. The following example demonstrates this approach:

```javascript
const gulp = require('gulp')
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('scripts', function() {
    return gulp.src('lib/*.ts')
        .pipe(sourcemaps.init()) // This means sourcemaps will be generated
        .pipe(ts.compile({
            // ...
        }))
        .pipe( ... ) // You can use other plugins that also support gulp-sourcemaps
        .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
        .pipe(gulp.dest('dist'));
});
```

When you are not inlining the source content, you should specify the `sourceRoot` property. It can be configured with the following rule:

- If you don't provide the `outDir` option to TypeScript, the `sourceRoot` option of gulp-sourcemaps should be the relative path from the `gulp.dest` path to the source directory (from `gulp.src`)
- If you set the `outDir` option to the same value as the directory in `gulp.dest`, you should set the `sourceRoot` to `./`.
- If you set the `outDir` option to a different value, there is no easy rule to configure gulp-sourcemaps. I'd advise to change the value of outDir if possible.

Furthermore you should set `includeContent: false`. Here's an example where `outDir` isn't set:
```js
gulp.task('scripts', function() {
    return gulp.src('lib/*.ts')
        .pipe(sourcemaps.init())
        .pipe(ts.compile({
            // ...
        }))
        .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../lib' }))
        .pipe(gulp.dest('dist'));
});
```

Some examples can be found in [ivogabe/gulp-typescript-sourcemaps-demo](https://github.com/ivogabe/gulp-typescript-sourcemaps-demo).

For more information, see [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps).

Custom transforms
-----------------
You can pass aditional transforms to the compiler pipeline. We aligned with the interface of [awesome-typescript-loader](https://github.com/s-panferov/awesome-typescript-loader). You can specify transforms by setting the `getCustomTransformers` option.

The option expects a string, pointing at a module that exposes the transforms, or a function that returns the transforms. Its type is `getCustomTransformers: (string | ((program: ts.Program) => ts.CustomTransformers | undefined))`.

```js
const styledComponentsTransformer = require('typescript-plugin-styled-components').default;

const project = ts.createProject('test/customTransformers/tsconfig.json', {
    getCustomTransformers: () => ({
        before: [
            styledComponentsTransformer(),
        ]
    });
});
```

Reporters
---------
By default, errors are logged to the console and the build crashes on compiler errors. In watch mode, the build does not throw, meaning that consequent builds are still ran. Note that gulp 4 is required for this behaviour. If you are still using gulp 3, see  the section "Gulp 3" below.

If you want to change the way that messages are logged to the console (or some other output), you can provide a reporter. You can specify a custom reporter as the second argument of the main function, or as the only argument when using a `tsProject`:
```javascript
ts.compile(options, reporter);
tsProject(reporter);
```
Available reporters are:
- nullReporter (`ts.reporter.nullReporter()`) - Don't report errors
- defaultReporter (`ts.reporter.defaultReporter()`) - Report basic errors to the console
- longReporter (`ts.reporter.longReporter()`) - Extended version of default reporter, intelliJ link functionality + file watcher error highlighting should work using this one
- fullReporter (`ts.reporter.fullReporter(showFullFilename?: boolean)`) - Show full error messages, with source.

If you want to build a custom reporter, you take a look at `lib/reporter.ts`, that file declares an interface which a reporter should implement.

Gulp 3
------
This plugin works best with gulp 4. If you cannot update to this version, you may experience problems when using incremental compilations with a watcher. A compilation error will namely crash the process, which is desired in a CI environment. Gulp 4 prevents that the process crashes in watch mode. This does not happen in gulp 3, so you will need to handle that manually.

You should attach an error handler to catch those compilation errors.

```js
gulp.src(..)
  .pipe(ts.compile(..))
  .on('error', () => { /* Ignore compiler errors */})
  .pipe(gulp.dest(..))
```

Build gulp-typescript
------------

1. Clone this repo
2. Execute `npm install`
3. Execute `git submodule update --init` to pull down the TypeScript compiler/services versions used in the test suite.
4. Ensure the gulp CLI is globally installed (`npm install -g gulp-cli`).
5. Execute the tests: `gulp`.

The plugin uses itself to compile. There are 2 build directories, ```release``` and ```release-2```. ```release``` must always contain a working build. ```release-2``` contains the last build. When you run ```gulp compile```, the build will be saved in the ```release-2``` directory. ```gulp test``` will compile the source to ```release-2```, and then it will run some tests. If these tests give no errors, you can run ```gulp release```. The contents from ```release-2``` will be copied to ```release```.


License
-------
gulp-typescript is licensed under the [MIT license](http://opensource.org/licenses/MIT).
