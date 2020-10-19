import React from 'react'
import PropTypes from 'prop-types'
export default function BaseLogo({
  width,
  isFullWidth,
  children,
  aspectRatio,
  ...rest
}) {
  let height

  if (isFullWidth) {
    height = '100%'
  } else if (typeof width === 'number' && !Number.isNaN(width)) {
    height = Math.round(width * aspectRatio)
  }

  return (
    <svg
      {...rest}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      width={isFullWidth ? '100%' : width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      {children}
    </svg>
  )
}
BaseLogo.propTypes = {
  // The width of the Logo
  width: PropTypes.number,
  // If true, the logo will grow to fill the available width and height of the containing element
  isFullWidth: PropTypes.bool,
  // The paths for the logo being rendered
  children: PropTypes.node.isRequired,
  // The logos aspect ratio, used to determine the height based on the width of the logo
  aspectRatio: PropTypes.number.isRequired,
}
