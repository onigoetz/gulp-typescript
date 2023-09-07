import * as path from "path";
import * as ts from "typescript";
import { VinylFile } from "./types";
import * as utils from "./utils";

const has = Function.call.bind(Object.prototype.hasOwnProperty);

export enum FileChangeState {
	NEW = 0,
	EQUAL = 1,
	MODIFIED = 2,
	DELETED = 3,
	NOT_FOUND = 4,
}
export enum FileKind {
	SOURCE = 0,
	CONFIG = 1,
}

export interface FileChange {
	previous: File;
	current: File;
	state: FileChangeState;
}

export interface File {
	gulp?: VinylFile;
	fileNameNormalized: string;
	fileNameOriginal: string;
	content: string;
	kind: FileKind;
	ts?: ts.SourceFile;
}

function fromContent(
	caseSensitive: boolean,
	fileName: string,
	content: string,
): File {
	let kind = FileKind.SOURCE;
	if (path.extname(fileName).toLowerCase() === "json") kind = FileKind.CONFIG;

	return {
		fileNameNormalized: utils.normalizePath(caseSensitive, fileName),
		fileNameOriginal: fileName,
		content,
		kind,
	};
}

function fromGulp(caseSensitive: boolean, file: VinylFile): File {
	const str = (<Buffer>file.contents).toString("utf8");
	const data = fromContent(caseSensitive, file.path, str);
	data.gulp = file;

	return data;
}

function equal(a: File, b: File): boolean {
	if (a === undefined || b === undefined) return a === b; // They could be both undefined.
	return a.fileNameOriginal === b.fileNameOriginal && a.content === b.content;
}

function getChangeState(previous: File, current: File): FileChangeState {
	if (previous === undefined) {
		return current === undefined
			? FileChangeState.NOT_FOUND
			: FileChangeState.NEW;
	}
	if (current === undefined) {
		return FileChangeState.DELETED;
	}
	if (equal(previous, current)) {
		return FileChangeState.EQUAL;
	}
	return FileChangeState.MODIFIED;
}

export class FileDictionary {
	files: utils.Map<File> = {};
	firstSourceFile: File = undefined;
	caseSensitive: boolean;
	typescript: typeof ts;

	constructor(caseSensitive: boolean, typescript: typeof ts) {
		this.caseSensitive = caseSensitive;
		this.typescript = typescript;
	}

	addGulp(gFile: VinylFile) {
		return this.addFile(fromGulp(this.caseSensitive, gFile));
	}
	addContent(fileName: string, content: string) {
		return this.addFile(fromContent(this.caseSensitive, fileName, content));
	}
	private addFile(file: File) {
		if (file.kind === FileKind.SOURCE) {
			this.initTypeScriptSourceFile(file);
			if (!this.firstSourceFile) this.firstSourceFile = file;
		}
		this.files[file.fileNameNormalized] = file;
		return file;
	}

	getFile(name: string) {
		return this.files[utils.normalizePath(this.caseSensitive, name)];
	}

	initTypeScriptSourceFile: (file: File) => void;

	getFileNames(onlyGulp = false) {
		const fileNames: string[] = [];
		for (const fileName in this.files) {
			if (!has(this.files, fileName)) continue;
			const file = this.files[fileName];
			if (onlyGulp && !file.gulp) continue;
			fileNames.push(file.fileNameOriginal);
		}
		return fileNames;
	}

	private getSourceFileNames(onlyGulp?: boolean) {
		const fileNames = this.getFileNames(onlyGulp);
		const sourceFileNames = fileNames.filter(
			(fileName) =>
				fileName.substr(fileName.length - 5).toLowerCase() !== ".d.ts",
		);

		if (sourceFileNames.length === 0) {
			// Only definition files, so we will calculate the common base path based on the
			// paths of the definition files.
			return fileNames;
		}
		return sourceFileNames;
	}

	get commonBasePath() {
		const fileNames = this.getSourceFileNames(true);
		return utils.getCommonBasePathOfArray(
			fileNames.map((fileName) => {
				const file =
					this.files[utils.normalizePath(this.caseSensitive, fileName)];
				return path.resolve(process.cwd(), file.gulp.base);
			}),
		);
	}
	// This empty setter will prevent that TS emits 'readonly' modifier.
	// 'readonly' is not supported in current stable release.
	set commonBasePath(value) {}

	get commonSourceDirectory() {
		const fileNames = this.getSourceFileNames();
		return utils.getCommonBasePathOfArray(
			fileNames.map((fileName) => {
				const file =
					this.files[utils.normalizePath(this.caseSensitive, fileName)];
				return path.dirname(file.fileNameNormalized);
			}),
		);
	}
	// This empty setter will prevent that TS emits 'readonly' modifier.
	// 'readonly' is not supported in current stable release.
	set commonSourceDirectory(value) {}
}

export class FileCache {
	previous: FileDictionary = undefined;
	current: FileDictionary;
	options: ts.CompilerOptions;
	caseSensitive: boolean;
	noParse = false; // true when using a file based compiler.

	typescript: typeof ts;
	version = 0;

	constructor(
		typescript: typeof ts,
		options: ts.CompilerOptions,
		caseSensitive: boolean,
	) {
		this.typescript = typescript;
		this.options = options;
		this.caseSensitive = caseSensitive;
		this.createDictionary();
	}

	addGulp(gFile: VinylFile) {
		return this.current.addGulp(gFile);
	}
	addContent(fileName: string, content: string) {
		return this.current.addContent(fileName, content);
	}

	reset() {
		this.version++;
		this.previous = this.current;
		this.createDictionary();
	}

	private createDictionary() {
		this.current = new FileDictionary(this.caseSensitive, this.typescript);
		this.current.initTypeScriptSourceFile = (file) =>
			this.initTypeScriptSourceFile(file);
	}

	private initTypeScriptSourceFile(file: File) {
		if (this.noParse) return;
		if (this.previous) {
			const previous = this.previous.getFile(file.fileNameOriginal);
			if (equal(previous, file)) {
				file.ts = previous.ts; // Re-use previous source file.
				return;
			}
		}
		file.ts = this.typescript.createSourceFile(
			file.fileNameOriginal,
			file.content,
			this.options.target,
		);
	}

	getFile(name: string) {
		return this.current.getFile(name);
	}

	getFileChange(name: string): FileChange {
		let previous: File;
		if (this.previous) {
			previous = this.previous.getFile(name);
		}

		const current = this.current.getFile(name);

		return {
			previous,
			current,
			state: getChangeState(previous, current),
		};
	}

	getFileNames(onlyGulp = false) {
		return this.current.getFileNames(onlyGulp);
	}

	get firstSourceFile() {
		return this.current.firstSourceFile;
	}
	// This empty setter will prevent that TS emits 'readonly' modifier.
	// 'readonly' is not supported in current stable release.
	set firstSourceFile(value) {}

	get commonBasePath() {
		return this.current.commonBasePath;
	}
	set commonBasePath(value) {}

	get commonSourceDirectory() {
		return this.current.commonSourceDirectory;
	}
	set commonSourceDirectory(value) {}

	isChanged(onlyGulp = false) {
		if (!this.previous) return true;

		const files = this.getFileNames(onlyGulp);
		const oldFiles = this.previous.getFileNames(onlyGulp);

		if (files.length !== oldFiles.length) return true;

		for (const fileName of files) {
			if (oldFiles.indexOf(fileName) === -1) return true;
		}

		for (const fileName of files) {
			const change = this.getFileChange(fileName);
			if (change.state !== FileChangeState.EQUAL) return true;
		}

		return false;
	}
}
