import * as ts from 'typescript';
import * as path from 'path';
import { RawSourceMap } from './types';
import { File, FileChangeState } from './input';
import { Host } from './host';
import { ProjectInfo } from './project';
import { CompilationResult, emptyCompilationResult } from './reporter';
import * as utils from './utils';

export interface ICompiler {
	prepare(project: ProjectInfo): void;
	inputFile(file: File);
	inputDone();
}

/**
 * Compiles a whole project, with full type checking
 */
export class ProjectCompiler implements ICompiler {
	host: Host;
	project: ProjectInfo;
	program: ts.Program;

	prepare(project: ProjectInfo) {
		this.project = project;
	}

	inputFile(file: File) { }

	inputDone() {
		if (!this.project.input.firstSourceFile) {
			this.project.output.finish(emptyCompilationResult());
			return;
		}

		const rootFilenames: string[] = this.project.input.getFileNames(true);
		if (!this.project.singleOutput) {
			// Add an empty file under the root.
			// This will make sure the commonSourceDirectory, calculated by TypeScript, won't point to a subdirectory of the root.
			// We cannot use the `rootDir` option here, since that gives errors if the commonSourceDirectory points to a
			// directory containing the rootDir instead of the rootDir, which will break the build when using `noEmitOnError`.
			// The empty file is filtered out later on.
			/* let emptyFileName = path.join(this.project.options['rootDir'] ? path.resolve(this.project.projectDirectory, this.project.options['rootDir']) : root, '________________empty.ts');
			rootFilenames.push(emptyFileName);
			this.project.input.addContent(emptyFileName, ''); */
		}

		const currentDirectory = utils.getCommonBasePathOfArray(
			rootFilenames.map(fileName => this.project.input.getFile(fileName).gulp.cwd)
		);

		this.host = new Host(
			this.project.typescript,
			currentDirectory,
			this.project.input,
			this.project.options
		);

		this.program = this.project.typescript.createProgram(rootFilenames, this.project.options, this.host, this.program);
		const preEmitDiagnostics = this.project.typescript.getPreEmitDiagnostics(this.program);
		
		const result = emptyCompilationResult();
		result.optionsErrors = this.program.getOptionsDiagnostics().length;
		result.syntaxErrors = this.program.getSyntacticDiagnostics().length;
		result.globalErrors = this.program.getGlobalDiagnostics().length;
		result.semanticErrors = this.program.getSemanticDiagnostics().length;
		if (this.project.options.declaration) {
			result.declarationErrors = this.program.getDeclarationDiagnostics().length;
		}

		this.reportDiagnostics(preEmitDiagnostics);

		const emitOutput = this.program.emit();
		result.emitErrors = emitOutput.diagnostics.length;
		result.emitSkipped = emitOutput.emitSkipped;

		for (const fileName of this.host.input.getFileNames(true)) {
			const file = this.project.input.getFile(fileName);

			let jsFileName: string;
			let dtsFileName: string;
			let jsContent: string;
			let dtsContent: string;
			let jsMapContent: string;

			const emitOutput = this.program.emit(file.ts, (fileName: string, content: string) => {
				const [, extension] = utils.splitExtension(fileName, ['d.ts']);
				switch (extension) {
					case 'js':
					case 'jsx':
						jsFileName = fileName;
						jsContent = this.removeSourceMapComment(content);
						break;
					case 'd.ts':
						dtsFileName = fileName;
						dtsContent = content;
						break;
					case 'map':
						jsMapContent = content;
						break;
				}
			});

			result.emitErrors += emitOutput.diagnostics.length;
			this.reportDiagnostics(emitOutput.diagnostics);
			
			if (jsContent !== undefined) {
				// TODO: Set `base` correctly when `outDir` is set
				this.project.output.writeJs(file.gulp.base, jsFileName, jsContent, jsMapContent, file);
			}
			if (dtsContent !== undefined) {
				// TODO: Set `base` correctly when `outDir` or `declarationDir` is set
				this.project.output.writeDts(file.gulp.base, dtsFileName, dtsContent, file);
			}

			if (emitOutput.emitSkipped) {
				result.emitSkipped = true;
			}
		}

		this.project.output.finish(result);
	}

	private reportDiagnostics(diagnostics: ts.Diagnostic[]) {
		for (const error of diagnostics) {
			this.project.output.diagnostic(error);
		}
	}

	private removeSourceMapComment(content: string): string {
		// By default the TypeScript automaticly inserts a source map comment.
		// This should be removed because gulp-sourcemaps takes care of that.
		// The comment is always on the last line, so it's easy to remove it
		// (But the last line also ends with a \n, so we need to look for the \n before the other)
		const index = content.lastIndexOf('\n', content.length - 2);
		return content.substring(0, index) + '\n';
	}
}

interface FileResult {
	fileName: string;
	diagnostics: ts.Diagnostic[];
	content: string;
	sourceMap: string;
}
export class FileCompiler implements ICompiler {
	host: Host;
	project: ProjectInfo;

	private output: utils.Map<FileResult> = {};
	private previousOutput: utils.Map<FileResult> = {};

	private compilationResult: CompilationResult = undefined;
	
	prepare(project: ProjectInfo) {
		this.project = project;
		this.project.input.noParse = true;
		this.compilationResult = emptyCompilationResult();
	}

	private write(file: File, fileName: string, diagnostics: ts.Diagnostic[], content: string, sourceMap: string) {
		this.output[file.fileNameNormalized] = { fileName, diagnostics, content, sourceMap };
		
		for (const error of diagnostics) {
			this.project.output.diagnostic(error);
		}
		this.compilationResult.transpileErrors += diagnostics.length;
		
		this.project.output.writeJs(file.gulp.base, fileName, content, sourceMap, file);
	}

	inputFile(file: File) {
		if (file.fileNameNormalized.substr(file.fileNameNormalized.length - 5) === '.d.ts') {
			return; // Don't compile definition files
		}
		
		if (this.project.input.getFileChange(file.fileNameOriginal).state === FileChangeState.Equal) {
			// Not changed, re-use old file.
			
			const old = this.previousOutput[file.fileNameNormalized];
			this.write(file, old.fileName, old.diagnostics, old.content, old.sourceMap);

			return;
		}
		
		const diagnostics: ts.Diagnostic[] = [];
		const outputString = this.project.typescript.transpile(
			file.content,
			this.project.options,
			file.fileNameOriginal,
			diagnostics
		);
		let index = outputString.lastIndexOf('\n')
		let mapString = outputString.substring(index + 1);
		if (mapString.substring(0, 1) === '\r') mapString = mapString.substring(1);
		
		const start = '//# sourceMappingURL=data:application/json;base64,';
		if (mapString.substring(0, start.length) !== start) {
			console.error('Couldn\'t read the sourceMap generated by TypeScript. This is likely an issue with gulp-typescript.');
			return;
		}
		
		mapString = mapString.substring(start.length);
		
		let map: RawSourceMap = JSON.parse(new Buffer(mapString, 'base64').toString());
		map.sourceRoot = path.resolve(file.gulp.cwd, file.gulp.base)
		map.sources[0] = path.relative(map.sourceRoot, file.gulp.path);
		
		const [fileNameExtensionless] = utils.splitExtension(file.fileNameOriginal);
		const [, extension] = utils.splitExtension(map.file); // js or jsx
		
		this.write(file, fileNameExtensionless + '.' + extension, diagnostics, outputString.substring(0, index), JSON.stringify(map));
	}

	inputDone() {
		this.project.output.finish(this.compilationResult);
		
		this.previousOutput = this.output;
		this.output = {};
	}
}
