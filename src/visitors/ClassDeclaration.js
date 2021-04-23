import generate from '@babel/generator'
import { formatComments } from '../utils'

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

/*
PropType visitor
Static propTypes handler

```
class Foo extends React.Component {
  static propTypes = {
    // some comment here
    foo: PropTypes.bool
  }
}
```
*/
export function createClassDeclaration({ types: t }) {
  return function ClassDeclaration(path, state) {
    let { reactComponentImport, reactDefaultImport } = this.data.__internal
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
      let component = this.data.components.find(
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
        if (this.data.components.find((comp) => comp.name === componentName)) {
          this.data.components = this.data.components.map((comp) => {
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
          this.data.components = [component]
        }
      }
    }
  }
}
