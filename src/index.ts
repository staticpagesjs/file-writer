import * as fs from 'fs';
import * as path from 'path';

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
	onOverwrite?: { (fileName: string): void };
	unnamedPattern?: string;
};

export const fileWriter = (options: FileWriterOptions) => {
	const {
		outDir = 'dist',
		outFile = (data: FileWriterData): string => (
			data?.output?.path
			|| (
				data?.output?.url
				|| data?.header?.path?.substring?.(0, data.header.path.length - path.extname(data.header.path).length)
			) + '.html'
		),
		renderer = (data: FileWriterData): string => '' + data?.output?.body,
		onOverwrite = (fileName: string): void => console.warn(`WARNING: Overwriting '${fileName}'.`),
		unnamedPattern = 'unnamed-%d.html',
	} = options || {};

	if (typeof outDir !== 'string') {
		throw new Error('file-writer \'outDir\' error: expected a string.');
	}

	if (typeof outFile !== 'function') {
		throw new Error('file-writer \'outFile\' error: expected a function.');
	}

	if (typeof renderer !== 'function') {
		throw new Error('file-writer \'renderer\' error: expected a function.');
	}

	if (typeof onOverwrite !== 'function') {
		throw new Error('file-writer \'onOverwrite\' error: expected a function.');
	}

	if (typeof unnamedPattern !== 'string') {
		throw new Error('file-writer \'unnamedPattern\' error: expected a string.');
	}

	const dirCache = new Set<string>();
	const fileCache = new Set<string>();

	let unnamedCounter = 0;
	return async (data: Record<string, unknown>): Promise<void> => {
		const outputPath = path.resolve(outDir, await outFile(data) || unnamedPattern.replace('%d', (++unnamedCounter).toString()));
		const outputDirname = path.dirname(outputPath);
		if (!dirCache.has(outputDirname)) {
			fs.mkdirSync(outputDirname, { recursive: true });
			dirCache.add(outputDirname);
		}
		if (fileCache.has(outputPath)) {
			onOverwrite?.(outputPath);
		}
		fileCache.add(outputPath);
		fs.writeFileSync(outputPath, await renderer(data));
	};
};

export default fileWriter;
