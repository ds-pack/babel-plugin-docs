import path from 'path'
import fs from 'fs'

import { createImportDeclaration } from './visitors/ImportDeclaration'
import { createAssignmentExpression } from './visitors/AssignmentExpression'
import { createClassDeclaration } from './visitors/ClassDeclaration'
import { createFunctionDeclaration } from './visitors/FunctionDeclaration'

/* 


TODOS:
---

@TODO this needs to handle self-defined isolated types

e.g.
```
const someType = something;

Foo.propTypes = { bar: someType };
```

@TODO this needs to handle imported types

e.g.
```
import someType from './somewhere'

Foo.propTypes = { bar: someType }
```

*/
function lookupLocalOrImportedReferences({
  // If this prop is an identifier
  // e.g. `Foo.propTypes = { bar: someType }`
  // Then the `prop` value here will be that `someType` identifier,
  // looking like: { name: 'someType' }
  // If this prop is an object expression
  // e.g. `Foo.propTypes = { bar: PropTypes.string }`
  // Then the `prop` value here will be that `PropTypes.string` MemberExpression
  // Looking like: { object: {name: 'PropTypes'}, property: {name: 'string'} }
  prop,
  // An array of objects representing all the values that were imported
  // [{
  //   specifiers: [{
  //      type: 'default' | 'named',
  //      value: string
  //    }],
  //    source: string
  //  }]
  imports,
}) {
  console.log(imports)
  let foundReference = imports.find((importObject) => {
    return importObject.specifiers.find((importSpecifier) => {
      // imported -> value exported from other file
      // local -> local reference to that value
      if (importSpecifier.value.local === prop.name) {
        return true
      }
    })
  })
  if (foundReference) {
    // time to go look at that file
    // Need to track down the specifier that it matched
  }
}

let defaultOptions = {
  outputDirectory: 'dist',
  sourceDirectory: 'src',
  outputPostfix: 'metadata',
}

export default function docsPlugin({ types }, opts) {
  let options = {
    ...defaultOptions,
    ...opts,
  }
  let data = {
    initialRawCode: '',
    filename: '',
    components: [],
    imports: [],
    hooks: [],
    __internal: {
      // Array of named imports from prop-types package
      propTypesNamedImports: [],
      // imported specifier for the default/namespace prop-types import
      propTypesImport: '',
      // imported specifier for the default React import
      // e.g. import rEaCt from 'react' => rEaCt
      reactDefaultImport: '',
    },
  }
  return {
    name: 'babel-plugin-docs',
    inherits: require('babel-plugin-syntax-jsx'),
    pre(config) {
      data.initialRawCode = config.code
      let pathToProject = config.opts.cwd + path.sep + options.sourceDirectory
      data.filename = config.opts.filename.replace(
        pathToProject,
        '<project-root>',
      )
      data.__internal.sourcePath = pathToProject
    },
    visitor: {
      ImportDeclaration: createImportDeclaration({ types, data }),
      AssignmentExpression: createAssignmentExpression({ types, data }),
      ClassDeclaration: createClassDeclaration({ types, data }),
      FunctionDeclaration: createFunctionDeclaration({ types, data }),
    },
    post(config) {
      if (options.skipWriteFile) {
        return
      }
      let { __internal, ...rest } = data
      let filename = config.opts.filename.split('.')[0]
      let targetFilename =
        filename.replace(options.sourceDirectory, options.outputDirectory) +
        `.${options.outputPostfix}.js`

      // If we write the output to dist, it's possible that the path to this file
      // hasn't been created by babel yet
      // So we wrap this in a try..catch, that lets us check for the file path existing
      // and if it doesn't exist, we create the path to that file and attempt the write again
      // In all other cases we either let the error trickle up
      if (!fs.existsSync(path.dirname(targetFilename))) {
        fs.mkdirSync(path.dirname(targetFilename), { recursive: true })
      }
      fs.writeFileSync(
        targetFilename,
        `module.exports = ${JSON.stringify(rest, null, 2)}`,
      )
    },
  }
}
