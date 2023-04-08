# Static Pages / File writer
Writes contents of a page data to file.

## Usage
```js
import fileWriter from '@static-pages/file-writer';

const write = fileWriter({
  outDir: 'dist',
  outFile: d => d.url + '.html',
  renderer: d => d.body,
  onOverwrite: fileName => console.log(fileName),
  onInvalidPath: fileName => console.log(fileName),
});

const pageData = {
  url: 'folder/file',
  body: '[file contents]',
};

write({ value: pageData });
```

## Docs

`@static-pages/file-writer@5` and higher versions are compatible with `@static-pages/core@6` and higher versions.

### __`writer(options: Options): void`__

#### `Options`
- `options.outDir` (default: `dist`) sets the output directory.
- `options.outFile` resolves the file name based on the provided page data.
- `options.renderer` renders the file contents based on the provided page data.
- `options.onOverwrite` callback function that gets executed when a file name collision occurs. Defaults to log on the console.
- `options.onInvalidPath` callback function that gets executed when a file name contains invalid characters. Defaults to log on the console.

### `outFile` defaults
The default behaviour is to guess file path by a few possible properties of the data:

- if `data.url` is defined, append `.html` and use that.
- if `data.header.path` is defined, replace extension to `.html` and use that.
- if nothing matches call the `onInvalidPath` handler with `undefined` file name.

### `renderer` defaults
The default behaviour is to retrieve file contents from `data.body`.

> Tip: you can implement your own rendering logic in the `renderer` callback, eg: `renderer: d => myRenderingLibrary.render('template', d)`.

## Where to use this?
This module can be used to generate static HTML pages. Read more at the [Static Pages JS project page](https://staticpagesjs.github.io/).
