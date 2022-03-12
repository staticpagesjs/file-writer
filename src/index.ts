import * as fs from 'fs';
import * as path from 'path';
import { Script } from 'vm';

export type FileWriterData = {
	header?: {
		path?: string;
		[key: string]: unknown;
	};
	output?: {
		path?: string;
		url?: string;
		body?: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

export type FileWriterOptions = {
	outDir?: string;
	outFile?: { (data: FileWriterData): string | Promise<string> };
	renderer?: { (data: FileWriterData): string | NodeJS.ArrayBufferView | Promise<string | NodeJS.ArrayBufferView> };
};

export const fileWriter = (options: FileWriterOptions) => {
	let unnamedCounter = 1;
	const {
		outDir = 'build',
		outFile = (data: FileWriterData): string => (
			data?.output?.path
			|| (
				data?.output?.url
				|| data?.header?.path?.substring?.(0, data.header.path.length - path.extname(data.header.path).length)
				|| `unnamed-${unnamedCounter++}`
			) + '.html'
		),
		renderer = (data: FileWriterData): string => '' + data?.output?.body,
	} = options || {};

	if (typeof outDir !== 'string') {
		throw new Error('file-writer \'outDir\' parameter error: expected a string.');
	}

	if (typeof outFile !== 'function') {
		throw new Error('file-writer \'outFile\' parameter error: expected a function.');
	}

	if (typeof renderer !== 'function') {
		throw new Error('file-writer \'renderer\' parameter error: expected a function.');
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
			console.warn(`WARNING: Overwriting '${outputPath}'.`);
		}
		fileCache.add(outputPath);
		fs.writeFileSync(outputPath, await renderer(data));
	};
};

const isFunctionLike = /^\s*(?:async)?\s*(?:\([a-zA-Z0-9_, ]*\)\s*=>|[a-zA-Z0-9_,]+\s*=>|function\s*\*?\s*[a-zA-Z0-9_,]*\s*\([a-zA-Z0-9_,]*\)\s*{)/;

export const fileWriterOptionsFromCliParameters = (cliParams: object = {}) => {
	const { outFile, renderer, ...rest } = cliParams as FileWriterOptions;
	const options = { ...rest } as FileWriterOptions;

	if (typeof outFile === 'string') {
		if (!isFunctionLike.test(outFile)) {
			throw new Error('file-writer \'outFile\' parameter error: provided string does not look like a function.');
		}
		options.outFile = new Script(outFile).runInNewContext();
	}

	if (typeof renderer === 'string') {
		if (!isFunctionLike.test(renderer)) {
			throw new Error('file-writer \'renderer\' parameter error: provided string does not look like a function.');
		}
		options.renderer = new Script(renderer).runInNewContext();
	}

	return options;
};

export const cli = (cliParams: object = {}) => fileWriter(fileWriterOptionsFromCliParameters(cliParams));

export default fileWriter;
