import parseJSDocComments from '@ds-pack/jsdoc-parser'
import { formatComments } from '../utils'

export function createFunctionDeclaration({ types, data }) {
  return function FunctionDeclaration(path) {
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
  }
}
