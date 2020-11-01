import path from 'path'
import fs from 'fs'

import { createImportDeclaration } from './visitors/ImportDeclaration'
import { createAssignmentExpression } from './visitors/AssignmentExpression'
import { createClassDeclaration } from './visitors/ClassDeclaration'
import { createFunctionDeclaration } from './visitors/FunctionDeclaration'

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
      ImportDeclaration: createImportDeclaration({ types, data, config }),
      AssignmentExpression: createAssignmentExpression({ types, data, config }),
      ClassDeclaration: createClassDeclaration({ types, data, config }),
      FunctionDeclaration: createFunctionDeclaration({ types, data, config }),
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
