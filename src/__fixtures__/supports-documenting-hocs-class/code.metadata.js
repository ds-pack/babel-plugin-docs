module.exports = {
  "initialRawCode": "// Usage:\n// <Foo bar=\"blah\" />\nexport default function makeFoo(Comp) {\n  let test\n\n  return class Foo extends React.Component {\n    static propTypes = {\n      // some comment here\n      bar: PropTypes.string.isRequired,\n      // another comment here\n      // multi-line this time\n      foo: PropTypes.bool,\n      /**\n       * Block comment here\n       *\n       * With multiple lines\n       */\n      test,\n    }\n\n    static defaultProps = {\n      bar: 'foo',\n      foo: false,\n      test: 'anotherTest',\n    }\n\n    render() {\n      return <div />\n    }\n  }\n}\n",
  "filename": "<project-root>/__fixtures__/supports-documenting-hocs-class/code.js",
  "components": [],
  "imports": [],
  "hooks": []
}