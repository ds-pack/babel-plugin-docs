import pluginTester from 'babel-plugin-tester'
import { plugin } from './index.js'
import path from 'path'

pluginTester({
  plugin,
  pluginOptions: {
    // write to local source so the test results are checked in
    outputDirectory: 'src',
  },
  fixtures: path.join(__dirname, '__fixtures__'),
})
