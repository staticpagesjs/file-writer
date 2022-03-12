import * as fs from 'fs';
import * as path from 'path';
import { Script } from 'vm';

export type FileWriterOptions = {
	outDir?: string;
	outFile?: { (data: Record<string, unknown>): string | Promise<string> };
	renderer?: { (data: Record<string, unknown>): string | Promise<string> };
};

export function fileWriter(options: FileWriterOptions) {
	let unnamedCounter = 1;
	const {
		outDir = 'build',
		outFile = (data): string => (
			data?.output?.['path']
			|| (
				data?.output?.['url']
				|| data?.header?.['path']?.substring?.(0, data.header['path'].length - path.extname(data.header['path']).length)
				|| `unnamed-${unnamedCounter++}`
			) + '.html'
		),
		renderer = (data): string => '' + data?.output?.['body'],
	} = options || {};

	if (typeof outDir !== 'string') {
		throw new Error('file-writer \'outDir\' argument error: expected a string.');
	}

	if (typeof outFile !== 'function') {
		throw new Error('file-writer \'outFile\' argument error: expected a function.');
	}

	if (typeof renderer !== 'function') {
		throw new Error('file-writer \'renderer\' argument error: expected a function.');
	}

	const dirCache = new Set<string>();
	const fileCache = new Set<string>();

	return async (data: Record<string, unknown>): Promise<void> => {
		const outputPath = path.resolve(outDir, await outFile(data));
		const outputDirname = path.dirname(outputPath);
		if (!dirCache.has(outputDirname)) {
			fs.mkdirSync(outputDirname, { recursive: true });
			dirCache.add(outputDirname);
		}
		if (fileCache.has(outputPath)) {
			console.warn(`WARNING: Overwriting '${outputPath}': 'outFile()' generated same path for multiple inputs.`);
		}
		fileCache.add(outputPath);
		fs.writeFileSync(outputPath, await renderer(data));
	};
}

const isFunctionLike = /^\s*(?:async)?\s*(?:\([a-zA-Z0-9_, ]*\)\s*=>|[a-zA-Z0-9_,]+\s*=>|function\s*\*?\s*[a-zA-Z0-9_,]*\s*\([a-zA-Z0-9_,]*\)\s*{)/;

export function cli(options: unknown = {}) {
	const { outFile, renderer, ...rest } = options as FileWriterOptions;
	const opts = { ...rest } as FileWriterOptions;

	if (typeof outFile === 'string') {
		if (!isFunctionLike.test(outFile)) {
			throw new Error('\'outFile\' error: provided string does not look like a function.');
		}
		opts.outFile = new Script(outFile).runInNewContext();
	}

	if (typeof renderer !== 'string') {
		throw new Error('Must provide \'renderer\' argument to file-writer.');
	}
	if (!isFunctionLike.test(renderer)) {
		throw new Error('\'renderer\' error: provided string does not look like a function.');
	}
	opts.renderer = new Script(renderer).runInNewContext();

	return fileWriter(opts);
}

export default fileWriter;
