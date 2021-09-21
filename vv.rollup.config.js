export default {
  input: './src/vv/vanillaview.js',
  output: {
    inlineDynamicImports: true,
    file: './dist/vv.bundle.bang.js',
    format: 'umd',
    name: 'vv.bang',
    strict: false	
  },
}
