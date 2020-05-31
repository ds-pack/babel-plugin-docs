// Flag to determine if an import is a nameespace import
// We probably don't need this if we just collect the raw import declarations
let namespaceImportSigil = {}

export function createImportDeclaration({ types: t, data }) {
  return function ImportDeclaration(path, state) {
    // Collect import metadata about React and React.Component
    let {
      opts: { reactSource = 'react', reactComponentValue = 'Component' } = {},
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
  }
}
