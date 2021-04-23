import generate from '@babel/generator'
import { formatComments } from '../utils'

/*
PropType visitor
Classic componentName.propTypes handler

```
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
export function createAssignmentExpression({ types: t }) {
  return function AssignmentExpression(path, state) {
    let didEncounterProps = false
    // Not all AssignmentExpressions are MemberExpressions
    // e.g. height = '100%' is an AssignmentExpression, but the left hand side isn't
    // a MemberExpression, in these cases we want to bail early
    //
    // @TODO - Do we want to truly bail early here? What if we have code like:
    // ```js
    // const propTypes = { ... };
    // Component.propTypes = propTypes;
    // ```
    if (!t.isMemberExpression(path.node.left)) {
      return
    }
    // path.node.left === "Component.propTypes" or path.node.left === "Component.defaultProps"
    // Component
    let componentName = path.node.left.object.name
    // Setup the data we will return
    let component = this.data.components.find(
      (comp) => comp.name === componentName,
    )
    if (!component) {
      component = {
        name: componentName,
        props: [],
      }
    }
    let propData = component.props || []
    if (
      // Foo.propTypes
      path.node.left.property.name === 'propTypes'
    ) {
      didEncounterProps = true
      // Iterate through the prop-types
      // @TODO assumes an object expression definition
      let props = path.node.right.properties
      props.forEach((prop) => {
        // grab the prop name
        // @TODO test for expressions here: {[foo]: PropTypes.string}
        let propName
        // Foo.defaultProps = { ...something }
        if (t.isSpreadElement(prop)) {
          propName = generate(prop).code
        } else if (t.isObjectProperty(prop)) {
          // grab the prop name
          // @TODO test for expressions here: {[foo]: PropTypes.string}
          propName = prop.key.name
        }
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
          // lookupLocalOrImportedReferences({
          //   prop: prop.value,
          //   imports: this.data.imports,
          //   propObj,
          // })
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
        let propName
        // Foo.defaultProps = { ...something }
        if (t.isSpreadElement(prop)) {
          propName = generate(prop).code
        } else if (t.isObjectProperty(prop)) {
          // grab the prop name
          // @TODO test for expressions here: {[foo]: PropTypes.string}
          propName = prop.key.name
        }
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
              props: [...comp.props, ...component.props].reduce((acc, prop) => {
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
              }, []),
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
