module.exports = {
  "initialRawCode": "import React from 'react';\nimport PropTypes from 'prop-types';\n\nexport default function BaseLogo({\n  width,\n  isFullWidth,\n  children,\n  aspectRatio,\n  ...rest\n}) {\n  let height;\n  if (isFullWidth) {\n    height = '100%';\n  } else if (typeof width === 'number' && !Number.isNaN(width)) {\n    height = Math.round(width * aspectRatio);\n  }\n  return (\n    <svg\n      {...rest}\n      style={{\n        display: 'inline-block',\n        verticalAlign: 'middle',\n      }}\n      width={isFullWidth ? '100%' : width}\n      height={height}\n      xmlns=\"http://www.w3.org/2000/svg\"\n      role=\"img\"\n    >\n      {children}\n    </svg>\n  );\n}\n\nBaseLogo.propTypes = {\n  // The width of the Logo\n  width: PropTypes.number,\n  // If true, the logo will grow to fill the available width and height of the containing element\n  isFullWidth: PropTypes.bool,\n  // The paths for the logo being rendered\n  children: PropTypes.node.isRequired,\n  // The logos aspect ratio, used to determine the height based on the width of the logo\n  aspectRatio: PropTypes.number.isRequired,\n};\n",
  "filename": "<project-root>/__fixtures__/regression-assignment-expressions/code.js",
  "components": [
    {
      "name": "BaseLogo",
      "props": [
        {
          "name": "width",
          "type": {
            "comments": " The width of the Logo",
            "raw": "PropTypes.number"
          }
        },
        {
          "name": "isFullWidth",
          "type": {
            "comments": " If true, the logo will grow to fill the available width and height of the containing element",
            "raw": "PropTypes.bool"
          }
        },
        {
          "name": "children",
          "type": {
            "comments": " The paths for the logo being rendered",
            "raw": "PropTypes.node.isRequired"
          }
        },
        {
          "name": "aspectRatio",
          "type": {
            "comments": " The logos aspect ratio, used to determine the height based on the width of the logo",
            "raw": "PropTypes.number.isRequired"
          }
        }
      ]
    }
  ],
  "imports": [
    {
      "specifiers": [
        {
          "type": "default",
          "value": {
            "local": "React",
            "original": "React"
          }
        }
      ],
      "source": "react"
    },
    {
      "specifiers": [
        {
          "type": "default",
          "value": {
            "local": "PropTypes",
            "original": "PropTypes"
          }
        }
      ],
      "source": "prop-types"
    }
  ],
  "hooks": []
}