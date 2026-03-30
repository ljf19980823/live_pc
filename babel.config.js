module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', {
      useBuiltIns: 'usage',
      corejs: { version: 3, proposals: true }
    }]
  ],
  plugins: [
    // Element UI 按需引入（如需按需加载请启用，并安装 babel-plugin-component）
    // ['component', { libraryName: 'element-ui', styleLibraryName: 'theme-chalk' }]
  ]
}
