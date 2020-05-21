module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV)
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: true,
          },
        },
      ],
      '@babel/preset-react',
    ],
  }
}
