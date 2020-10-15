module.exports = {
  "initialRawCode": "// Usage:\n// <Foo bar=\"blah\" />\nexport default function Foo() {\n  return <div />\n}\n\nFoo.propTypes = {\n  // some comment here\n  bar: PropTypes.string.isRequired,\n}\n",
  "filename": "<project-root>/__fixtures__/works/code.js",
  "components": [
    {
      "name": "Foo",
      "props": [
        {
          "name": "bar",
          "type": {
            "comments": " some comment here",
            "raw": "PropTypes.string.isRequired"
          }
        }
      ]
    }
  ],
  "imports": [],
  "hooks": []
}