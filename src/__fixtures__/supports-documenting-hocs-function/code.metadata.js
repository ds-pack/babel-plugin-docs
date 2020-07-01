module.exports = {
  "initialRawCode": "// Usage:\n// <Foo bar=\"blah\" />\nexport default function makeFoo(Comp) {\n  function Foo(props) {\n    return <div />\n  }\n\n  let test\n\n  Foo.propTypes = {\n    // some comment here\n    bar: PropTypes.string.isRequired,\n    // another comment here\n    // multi-line this time\n    foo: PropTypes.bool,\n    /**\n     * Block comment here\n     *\n     * With multiple lines\n     */\n    test,\n  }\n\n  Foo.defaultProps = {\n    bar: 'foo',\n    foo: false,\n    test: 'anotherTest',\n  }\n\n  return Foo\n}\n",
  "filename": "/Users/matt/dev/babel-plugin-docs/src/__fixtures__/supports-documenting-hocs-function/code.js",
  "components": [
    {
      "name": "Foo",
      "props": [
        {
          "name": "bar",
          "type": {
            "comments": " some comment here",
            "raw": "PropTypes.string.isRequired"
          },
          "default": {
            "raw": "'foo'"
          }
        },
        {
          "name": "foo",
          "type": {
            "comments": " another comment here\n multi-line this time",
            "raw": "PropTypes.bool"
          },
          "default": {
            "raw": "false"
          }
        },
        {
          "name": "test",
          "type": {
            "comments": "/**\n     * Block comment here\n     *\n     * With multiple lines\n     \n*/"
          },
          "default": {
            "raw": "'anotherTest'"
          }
        }
      ]
    }
  ],
  "imports": [],
  "hooks": []
}