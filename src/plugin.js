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

export function docsPlugin({ types }) {
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
    pre(state) {
      data.initialRawCode = state.code
      data.filename = state.opts.filename
    },
    visitor: {
      ImportDeclaration: createImportDeclaration({ types, data }),
      AssignmentExpression: createAssignmentExpression({ types, data }),
      ClassDeclaration: createClassDeclaration({ types, data }),
      FunctionDeclaration: createFunctionDeclaration({ types, data }),
    },
    post(state) {
      if (state.opts.skipWriteFile) {
        return
      }
      let dir = path.dirname(state.opts.filename)
      let filename = path.basename(state.opts.filename).split('.')[0]
      let { __internal, ...rest } = data
      fs.writeFileSync(
        path.join(dir, `${filename}.metadata.js`),
        `module.exports = ${JSON.stringify(rest, null, 2)}`,
      )
    },
  }
}
