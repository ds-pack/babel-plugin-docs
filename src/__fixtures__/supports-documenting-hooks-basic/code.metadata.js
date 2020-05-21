module.exports = {
  "initialRawCode": "/**\n * useFoo\n *\n * Example Usage:\n * ```jsx\n * const val = useFoo(initialState);\n * ```\n *\n * @param {number} initialState The initial state of the useFoo hook\n * @returns {number} The current value\n */\nexport default function useFoo() {\n  return []\n}\n",
  "filename": "/Users/matt/dev/babel-plugin-docs/src/__fixtures__/supports-documenting-hooks-basic/code.js",
  "components": [],
  "imports": [],
  "hooks": [
    {
      "name": "useFoo",
      "rawLeadingComments": "/**\n * useFoo\n *\n * Example Usage:\n * ```jsx\n * const val = useFoo(initialState);\n * ```\n *\n * @param {number} initialState The initial state of the useFoo hook\n * @returns {number} The current value\n \n*/",
      "jsDoc": [
        {
          "tags": [
            {
              "optional": false,
              "type": "number",
              "name": "initialState",
              "description": "The initial state of the useFoo hook",
              "tag": "param",
              "line": 8,
              "source": "@param {number} initialState The initial state of the useFoo hook"
            },
            {
              "optional": false,
              "type": "number",
              "name": "The",
              "description": "current value",
              "tag": "returns",
              "line": 9,
              "source": "@returns {number} The current value"
            }
          ],
          "line": 0,
          "description": "useFoo\n\nExample Usage:\n```jsx\nconst val = useFoo(initialState);\n```",
          "source": "useFoo\n\nExample Usage:\n```jsx\nconst val = useFoo(initialState);\n```\n\n@param {number} initialState The initial state of the useFoo hook\n@returns {number} The current value"
        }
      ]
    }
  ]
}