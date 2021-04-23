# Babel Plugin Docs

A collection of babel tooling for collecting documentation from source code of
components and hooks.

## Usage

> ⚠️ This plugin might not be ready for primetime! I encourage experimenting
> with it and reporting any issues you encounter!

**Installation**

```sh
yarn add @ds-pack/babel-plugin-docs -D
# or if you use npm
npm install -D @ds-pack/babel-plugin-docs
```

**Configuring**

Within your babel config, add the following:

```js
plugins: [
  [
    '@ds-pack/babel-plugin-docs/plugin',
    {
      // optional, defaults to `'src'`
      // Where the source code exists for the library within the project
      sourceDirectory: 'src',
      // optional, defaults to `'dist'`
      // Where babel will generally output the compiled files to
      outputDirectory: 'dist',
      // optional, defaults to false
      // If true, the metadata file won't be written to the filesystem
      // if false, the metadata file will be written to `<outputDirectory>/<filename>.metadata.js`
      skipWriteFile: false,
      // optional, defualts to `'metadata'`
      // Will be the postfix on the generated file (if skipWriteFile is false)
      // e.g. if your filename is `AvatarButton.js` the output will be
      // `AvatarButton.metadata.js`
      outputPostfix: 'metadata',
      // optional, defaults to `'react'`
      // the package from which React/Component/built-in hooks are imported
      // e.g. if you use `preact`, change this to `'preact'`
      reactSource: 'react',
      // optional, defaults to `'Component'`
      // This is used to determine if a class extends `React.Component`
      reactComponentValue: 'Component',
      // optional, defaults to `'prop-types'`
      // This is the source package for prop-types imports
      propTypesSource: 'prop-types'
    },
  ],
]
```

### Tools:

- Babel
- Jest

## TODO:

- Add functionality for `propertyControls`
- Enumerate all open TODOs in the code
- Add tests for open TODOs

### Architecture and Design

This project is meant to be collection of babel tooling around documenting code.
Currently (as of June 2020) it primarily ships a babel plugin that extracts
documentation from React components and custom React hooks. In the future it
might split the visitors out as individual exports to enable a plugin-like
architecture.

We have opted to write to an external file instead of ammending the current file
being visited by babel to ensure that the code added via this plugin **doesn't**
impact the production bundle size of applications consuming your library.
