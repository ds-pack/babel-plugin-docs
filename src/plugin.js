import path from 'path'
import fs from 'fs'
import parseJSDocComments from '@ds-pack/jsdoc-parser'
import generate from '@babel/generator'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

let defaultOptions = {
  outputDirectory: 'dist',
  sourceDirectory: 'src',
  outputPostfix: 'metadata',
}

// START UTILS

function formatComments(comments) {
  return comments
    .map((comment) => {
      if (comment.type === 'CommentBlock') {
        return `/*${comment.value}\n*/`
      }
      return comment.value
    })
    .join('\n')
}

function isReactSuperClass({
  superClass,
  types: t,
  reactComponentImport = 'Component',
  reactDefaultImport = 'React',
}) {
  if (t.isMemberExpression(superClass)) {
    return (
      superClass.object.name === reactDefaultImport &&
      superClass.property.name === 'Component'
    )
  } else {
    return superClass.name === reactComponentImport
  }
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
        console.log(path.node)
      },
    })

    //
  }
}

// END UTILS

// Flag to determine if an import is a nameespace import
// We probably don't need this if we just collect the raw import declarations
let namespaceImportSigil = {}

export default function docsPlugin({ types: t }, opts) {
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
  let config = {
    parserOptions: {
      sourceType: 'module',
    },
  }
  return {
    name: 'babel-plugin-docs',
    inherits: require('babel-plugin-syntax-jsx'),
    pre(preConfig) {
      data.initialRawCode = preConfig.code
      let pathToProject =
        preConfig.opts.cwd + path.sep + options.sourceDirectory
      data.filename = preConfig.opts.filename.replace(
        pathToProject,
        '<project-root>',
      )
      data.__internal.sourcePath = pathToProject

      // bootstrap config
      config.cwd = path.dirname(preConfig.opts.filename)
      config.sourceFilePath = preConfig.opts.filename
      config.parserOptions = {
        ...config.parserOptions,
        ...preConfig.opts.parserOptions,
      }
    },
    visitor: {
      ImportDeclaration(path, state) {
        // Collect import metadata about React and React.Component
        let {
          opts: {
            reactSource = 'react',
            reactComponentValue = 'Component',
          } = {},
        } = state
        if (path.node.source.value === reactSource) {
          for (let specifier of path.node.specifiers) {
            // import * as React from 'react';
            if (t.isImportNamespaceSpecifier(specifier)) {
              data.__internal.reactDefaultImport = specifier.local.name
              // import React from 'react';
            } else if (t.isImportDefaultSpecifier(specifier)) {
              data.__internal.reactDefaultImport = specifier.local.name
              // import {Component} from 'react';
            } else if (t.isImportSpecifier(specifier)) {
              if (specifier.imported.name === reactComponentValue) {
                data.__internal.reactComponentImport = specifier.local.name
              }
            }
          }
        }

        // Collect PropTypes import
        let { opts: { propTypesSource = 'prop-types' } = {} } = state
        if (path.node.source.value === propTypesSource) {
          for (let specifier of path.node.specifiers) {
            // import * as propTypes from 'prop-types'
            if (t.isImportNamespaceSpecifier(specifier)) {
              data.__internal.propTypesImport = specifier.local.name
              // import PropTypes from 'prop-types'
            } else if (t.isImportDefaultSpecifier(specifier)) {
              data.__internal.propTypesImport = specifier.local.name
              // import {string, bool} from 'prop-types'
            } else if (t.isImportSpecifier(specifier)) {
              data.__internal.propTypesNamedImports.push({
                type: specifier.imported.name,
                value: specifier.local.name,
              })
            }
          }
        }

        // Push all imports into the imports metadata
        data.imports.push({
          specifiers: path.node.specifiers.map((specifier) => {
            return {
              type: t.isImportDefaultSpecifier(specifier) ? 'default' : 'named',
              value: {
                local: specifier.local.name,
                imported: specifier.imported
                  ? specifier.imported.name
                  : t.isImportNamespaceSpecifier(specifier)
                  ? namespaceImportSigil
                  : specifier.local.name,
              },
            }
          }),
          source: path.node.source.value,
        })
      },
      /*
      PropType visitor
      Classic componentName.propTypes handler

      ```js
      function Component(props) { ... }

      Component.propTypes = {
        // Some comment here
        foo: PropTypes.bool
      }
      Component.defaultProps = {
        // Default comment
        foo: 'bar'
      }
      ```
      */
      AssignmentExpression(path) {
        let didEncounterProps = false
        // Not all AssignmentExpressions are MemberExpressions
        // e.g. height = '100%' is an AssignmentExpression, but the left hand side isn't
        // a MemberExpression, in these cases we want to bail early
        if (!t.isMemberExpression(path.node.left)) {
          return
        }
        // path.node.left === "Component.propTypes" or path.node.left === "Component.defaultProps"
        // Component
        let componentName = path.node.left.object.name
        // Setup the data we will return
        let component = data.components.find(
          (comp) => comp.name === componentName,
        )
        if (!component) {
          component = {
            name: componentName,
          }
        }
        let propData = component.props || []
        if (
          // Foo.propTypes
          t.isMemberExpression(path.node.left) &&
          path.node.left.property.name === 'propTypes'
        ) {
          didEncounterProps = true
          // Iterate through the prop-types
          // @TODO assumes an object expression definition
          let props = path.node.right.properties
          props.forEach((prop) => {
            // grab the prop name
            // @TODO test for expressions here: {[foo]: PropTypes.string}
            let propName = prop.key.name
            let propObj = {
              name: propName,
              type: {},
            }
            if (Array.isArray(prop.leadingComments)) {
              propObj.type.comments = formatComments(prop.leadingComments)
            }
            // Foo.propTypes = { bar: value }
            if (t.isIdentifier(prop.value)) {
              // @TODO
              lookupLocalOrImportedReferences({
                prop: prop.value,
                imports: data.imports,
                propObj,
                config,
              })
            } else if (t.isMemberExpression(prop.value)) {
              // Foo.propTypes = {bar: PropTypes.value }
              let propType = prop.value.object.name
              // Again here handles nested calls, e.g. `Foo.propTypes = { bar: PropTypes.string.isRequired }`
              if (t.isMemberExpression(prop.value.object)) {
                propObj.type.raw = generate(prop.value).code
              } else {
                propObj.type.raw = generate(prop.value).code
              }
            } else {
              // Otherwise give up and try to parse the code
              propObj.type.raw = generate(prop.value).code
            }

            // Merge the prop into existing propData
            if (propData.find((prop) => prop.name === propName)) {
              propData = propData.map((propDatum) => {
                if (propDatum.name === propObj.name) {
                  return {
                    ...propDatum,
                    ...propObj,
                  }
                }
                return propDatum
              })
            } else {
              propData = [...propData, propObj]
            }
          })
        } else if (
          // Foo.defaultProps
          t.isMemberExpression(path.node.left) &&
          path.node.left.property.name === 'defaultProps'
        ) {
          didEncounterProps = true
          // Iterate through the prop-types
          // @TODO assumes an object expression definition
          let defaultProps = path.node.right.properties
          defaultProps.forEach((prop) => {
            // grab the prop name
            // @TODO test for expressions here: {[foo]: PropTypes.string}
            let propName = prop.key.name
            let propObj = {
              name: propName,
              default: {},
            }
            if (Array.isArray(prop.leadingComments)) {
              propObj.default.comments = formatComments(prop.leadingComments)
            }
            // This is a bit weird, but if the prop is like PropTypes.string.isRequired
            // its nested another layer
            if (t.isMemberExpression(prop.value)) {
              let propType = prop.value.object.name
              if (t.isMemberExpression(prop.value.object)) {
                propObj.default.raw = generate(prop.value).code
              } else {
                propObj.default.raw = generate(prop.value).code
              }
            } else {
              propObj.default.raw = generate(prop.value).code
            }

            // Merge the prop into existing propData
            if (propData.find((prop) => prop.name === propName)) {
              propData = propData.map((propDatum) => {
                if (propDatum.name === propObj.name) {
                  return {
                    ...propDatum,
                    ...propObj,
                  }
                }
                return propDatum
              })
            } else {
              propData = [...propData, propObj]
            }
          })
        }

        if (didEncounterProps) {
          component.props = propData
          if (data.components.find((comp) => comp.name === componentName)) {
            data.components = data.components.map((comp) => {
              if (comp.name === componentName) {
                return {
                  ...comp,
                  ...component,
                  props: [...comp.props, ...component.props].reduce(
                    (acc, prop) => {
                      if (acc.find((p) => p.name === prop.name)) {
                        return acc.map((p) => {
                          if (p.name === prop.name) {
                            return {
                              ...p,
                              ...prop,
                            }
                          }
                          return p
                        })
                      }
                      return [...acc, prop]
                    },
                    [],
                  ),
                }
              }
              return comp
            })
          } else {
            data.components = [component]
          }
        }
      },
      /*
      PropType visitor
      Static propTypes handler

      ```js
      class Foo extends React.Component {
        static propTypes = {
          // some comment here
          foo: PropTypes.bool
        }
      }
      ```
      */
      ClassDeclaration(path, state) {
        let { reactComponentImport, reactDefaultImport } = data.__internal
        if (
          path.node.superClass &&
          isReactSuperClass({
            superClass: path.node.superClass,
            types: t,
            reactDefaultImport,
            reactComponentImport,
          })
        ) {
          // We know we are in a `class Foo extrends React.Component` here
          // find any static values in the class that are `propTypes`
          let staticPropTypes = path.node.body.body.find((bodyStatement) => {
            return (
              t.isClassProperty(bodyStatement) &&
              bodyStatement.static &&
              bodyStatement.key.name === 'propTypes'
            )
          })
          let staticDefaultProps = path.node.body.body.find((bodyStatement) => {
            return (
              t.isClassProperty(bodyStatement) &&
              bodyStatement.static &&
              bodyStatement.key.name === 'defaultProps'
            )
          })
          if (!staticPropTypes || !staticDefaultProps) {
            return
          }
          let didEncounterProps = false
          // Foo
          let componentName = path.node.id.name
          // Setup the data we will return
          let component = data.components.find(
            (comp) => comp.name === componentName,
          )
          if (!component) {
            component = {
              name: componentName,
            }
          }
          let propData = component.props || []
          if (staticPropTypes) {
            didEncounterProps = true
            // Iterate through the prop-types
            // @TODO assumes an object expression definition
            let props = staticPropTypes.value.properties
            props.forEach((prop) => {
              // grab the prop name
              // @TODO test for expressions here: {[foo]: PropTypes.string}
              let propName = prop.key.name
              let propObj = {
                name: propName,
                type: {},
              }
              if (Array.isArray(prop.leadingComments)) {
                propObj.type.comments = formatComments(prop.leadingComments)
              }
              // This is a bit weird, but if the prop is like PropTypes.string.isRequired
              // its nested another layer
              if (t.isMemberExpression(prop.value)) {
                let propType = prop.value.object.name
                if (t.isMemberExpression(prop.value.object)) {
                  propObj.type.raw = generate(prop.value).code
                } else {
                  propObj.type.raw = generate(prop.value).code
                }
              } else {
                propObj.type.raw = generate(prop.value).code
              }

              // Merge the prop into existing propData
              if (propData.find((prop) => prop.name === propName)) {
                propData = propData.map((propDatum) => {
                  if (propDatum.name === propObj.name) {
                    return {
                      ...propDatum,
                      ...propObj,
                    }
                  }
                  return propDatum
                })
              } else {
                propData = [...propData, propObj]
              }
            })
          }
          if (staticDefaultProps) {
            didEncounterProps = true
            // Iterate through the prop-types
            // @TODO assumes an object expression definition
            let defaultProps = staticDefaultProps.value.properties
            defaultProps.forEach((prop) => {
              // grab the prop name
              // @TODO test for expressions here: {[foo]: PropTypes.string}
              let propName = prop.key.name
              let propObj = {
                name: propName,
                default: {},
              }
              if (Array.isArray(prop.leadingComments)) {
                propObj.default.comments = formatComments(prop.leadingComments)
              }
              // This is a bit weird, but if the prop is like PropTypes.string.isRequired
              // its nested another layer
              if (t.isMemberExpression(prop.value)) {
                let propType = prop.value.object.name
                if (t.isMemberExpression(prop.value.object)) {
                  propObj.default.raw = generate(prop.value).code
                } else {
                  propObj.default.raw = generate(prop.value).code
                }
              } else {
                propObj.default.raw = generate(prop.value).code
              }

              // Merge the prop into existing propData
              if (propData.find((prop) => prop.name === propName)) {
                propData = propData.map((propDatum) => {
                  if (propDatum.name === propObj.name) {
                    return {
                      ...propDatum,
                      ...propObj,
                    }
                  }
                  return propDatum
                })
              } else {
                propData = [...propData, propObj]
              }
            })
          }

          if (didEncounterProps) {
            component.props = propData
            if (data.components.find((comp) => comp.name === componentName)) {
              data.components = data.components.map((comp) => {
                if (comp.name === componentName) {
                  return {
                    ...comp,
                    ...component,
                    props: [...comp.props, ...component.props].reduce(
                      (acc, prop) => {
                        if (acc.find((p) => p.name === prop.name)) {
                          return acc.map((p) => {
                            if (p.name === prop.name) {
                              return {
                                ...p,
                                ...prop,
                              }
                            }
                            return p
                          })
                        }
                        return [...acc, prop]
                      },
                      [],
                    ),
                  }
                }
                return comp
              })
            } else {
              data.components = [component]
            }
          }
        }
      },
      FunctionDeclaration(path) {
        // handle `function use*`
        if (path.node.id.name.startsWith('use')) {
          let leadingComments =
            path.node.leadingComments || path.parentPath.node.leadingComments
          let formattedComments = formatComments(leadingComments)
          let jsDoc = parseJSDocComments(formattedComments)

          data.hooks.push({
            name: path.node.id.name,
            rawLeadingComments: formattedComments,
            jsDoc: jsDoc,
          })
        }
        // @todo handle `{ useFoo() {} }` (aka object methods)
      },
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

      // If we attempted to write the output to dist,
      // it's possible that the path to this file hasn't been created by babel yet
      // So first we check for the file path existing
      // and if it doesn't exist, we create the path to that file and attempt the write
      // In all other cases we let the error trickle up
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
