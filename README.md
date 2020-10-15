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
plugins: ['@ds-pack/babel-plugin-docs/plugin']
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
