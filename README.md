# Static Pages / File writer
Writes contents of a page data to file.

## Usage
```js
import writerFactory from '@static-pages/file-writer';

const = writer = writerFactory({
  outDir: 'build',
  outFile: d => d.url + '.html',
  renderer: d => d.body,
});

const pageData = {
  url: 'folder/file',
  body: '[file contents]',
};

writer(pageData);
```

## Docs

### __`writer(options: Options): void`__

#### `Options`
- `options.outDir` (default: `build`) sets the output directory.
- `options.outFile` resolves the file name based on the provided page data.
- `options.renderer` renders the file contents based on the provided page data.

### `outFile` defaults
The default behaviour is to guess file path by a few possible properties of the data:

- if `data.output.path` is defined, use that.
- if `data.output.url` is defined, append `.html` and use that.
- if `data.header.path` is defined, replace extension to `.html` and use that.
- if nothing matches, name it `unnamed-{n}.html` where `{n}` is a counter.

### `renderer` defaults
The default behaviour is to retrieve file contents from `data.output.body`.

> Tip: you can implement your own rendering logic in the `render` callback, eg: `renderer: d => myRenderingLibrary.render('template', d)`.

## Where to use this?
This module can be used to generate static HTML pages. Read more at the [Static Pages JS project page](https://staticpagesjs.github.io/).
