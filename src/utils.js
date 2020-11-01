import fs from 'fs'
import path from 'path'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

function coalesce(visitors) {
  return function (path, state) {
    visitors.forEach((visitor) => {
      visitor(path, state)
    })
  }
}

export function mergeVisitors(visitorA, visitorB) {
  let tempResult = {}

  Object.entries(visitorA).forEach(([astName, visitorFunction]) => {
    if (tempResult[astName]) {
      tempResult[astName].push(visitorFunction)
    } else {
      tempResult[astName] = [visitorFunction]
    }
  })
  Object.entries(visitorB).forEach(([astName, visitorFunction]) => {
    if (tempResult[astName]) {
      tempResult[astName].push(visitorFunction)
    } else {
      tempResult[astName] = [visitorFunction]
    }
  })

  return Object.entries(tempResult).reduce((acc, [astName, visitors]) => {
    acc[astName] = coalesce(visitors)
    return acc
  }, {})
}

export function formatComments(comments) {
  return comments
    .map((comment) => {
      if (comment.type === 'CommentBlock') {
        return `/*${comment.value}\n*/`
      }
      return comment.value
    })
    .join('\n')
}

let fileCache = new Map()

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
export function lookupLocalOrImportedReferences({
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
  //      // imported === value exported from source
  //      // local === name of value aliased to locally
  //      value: { local: string, imported: string }
  //    }],
  //    source: string
  //  }]
  imports,
  // Config, additional metadata
  config: { sourceFilePath, cwd, parserOptions },
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
    let { specifiers, source } = foundReference
    let foundSpecifier = specifiers.find((specifier) => {
      return specifier.value.local === prop.name
    })

    let filepath = path.join(cwd, foundReference.source)
    if (path.extname(filepath) === '') {
      // try falling back to the same extension as the source file
      filepath += path.extname(sourceFilePath)
    }
    let file
    if (fileCache.has(path.basename(filepath))) {
      file = fileCache.get(path.basename(filepath))
    } else {
      try {
        file = fs.readFileSync(filepath, 'utf-8')
      } catch (e) {
        throw new Error(`Unable to read found import!
  
  Imported file: ${filepath}
  Imported by: ${sourceFilePath}
  `)
      }
      // store the file in cache
      fileCache.set(path.basename(filepath), file)
    }

    console.log(parserOptions)

    let ast = parse(file, parserOptions)

    let foundValue
    traverse(ast, {
      ExportDeclaration(path, state) {
        console.log(path)
      },
    })

    //
  }
}
