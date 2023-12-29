import * as fs from 'fs';
import * as path from 'path';

export const isAsyncIterable = <T>(x: unknown): x is AsyncIterable<T> => !!x && typeof x === 'object' && Symbol.asyncIterator in x && typeof x[Symbol.asyncIterator] === 'function';

export namespace fileWriter {
	export type Data = {
		header?: {
			path?: string;
			[key: string]: unknown;
		};
		url?: string;
		body?: string;
		[key: string]: unknown;
	};

	export type Options = {
		outDir?: string;
		outFile?: { (data: fileWriter.Data): string | Promise<string> };
		renderer?: { (data: fileWriter.Data): string | NodeJS.ArrayBufferView | Promise<string | NodeJS.ArrayBufferView> };
		onOverwrite?: { (fileName: string): void };
		onInvalidPath? (fileName: unknown): void;
	};
}

export const fileWriter = (options: fileWriter.Options) => {
	const {
		outDir = 'dist',
		outFile = (data: fileWriter.Data): string => (
			(
				data?.url ||
				data?.header?.path?.substring?.(
					0,
					data.header.path.length - path.extname(data.header.path).length
				)
			) + '.html'
		),
		renderer = (data: fileWriter.Data): string => '' + data?.body,
		onOverwrite = (fileName: string): void => console.warn(`WARNING: Overwriting '${fileName}'.`),
		onInvalidPath = (fileName: unknown): void => console.warn(`WARNING: Invalid file name '${typeof fileName === 'string' ? fileName : '<' + typeof fileName + '>' }'.`),
	} = options || {};

	if (typeof outDir !== 'string') {
		throw new Error('file-writer \'outDir\' error: expected a string.');
	} else if (['*', '?', '"', '<', '>', '|'].some(x => outDir.includes(x))) {
		throw new Error('file-writer \'outDir\' error: directory name cannot contain any of the characters * ? " < > |');
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

	if (typeof onInvalidPath !== 'function') {
		throw new Error('file-writer \'onInvalidPath\' error: expected a function.');
	}

	const dirCache = new Set<string>();
	const fileCache = new Set<string>();

	async function onePass(data: Record<string, unknown>) {
		const outputFilename = await outFile(data);
		if (typeof outputFilename !== 'string') {
			onInvalidPath(outputFilename);
			return;
		}
		const outputPath = path.resolve(outDir, outputFilename);
		if (!outputFilename || ['*', '?', '"', '<', '>', '|'].some(x => outputFilename.includes(x))) {
			onInvalidPath(outputPath);
			return;
		}
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
	}

	return async (data: IteratorResult<Record<string, unknown>> | AsyncIterable<Record<string, unknown>>): Promise<void> => {
		if (isAsyncIterable(data)) {
			for await (const item of data) {
				await onePass(item);
			}
		} else {
			if (data.done) return;
			await onePass(data.value);
		}
	};
};

export default fileWriter;
