const { defineConfig } = require('@vue/cli-service')
const path = require('path')

function resolve(dir) {
  return path.join(__dirname, dir)
}

module.exports = defineConfig({
  // 部署应用包时的基本 URL，Electron 打包使用 './' 相对路径
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',

  // 生产环境关闭 source map 以加速构建
  productionSourceMap: false,

  // 开发服务器配置
  devServer: {
    port: 8080,
    open: true,
    // 代理配置，解决跨域问题
    // target 需要填写实际后端服务地址
    proxy: {
      '/api': {
        target: 'http://47.92.30.163:8085',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    }
  },

  // CSS 相关配置
  css: {
    loaderOptions: {
      sass: {
        // 全局注入 scss 变量和 mixin
        additionalData: `
          @import "@/assets/styles/variables.scss";
          @import "@/assets/styles/mixins.scss";
        `
      }
    }
  },

  // Webpack 链式配置
  chainWebpack(config) {
    // 路径别名
    config.resolve.alias
      .set('@', resolve('src'))
      .set('@api', resolve('src/api'))
      .set('@utils', resolve('src/utils'))
      .set('@views', resolve('src/views'))
      .set('@components', resolve('src/components'))
      .set('@assets', resolve('src/assets'))
      .set('@store', resolve('src/store'))

    // 生产环境优化
    config.when(process.env.NODE_ENV === 'production', config => {
      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          libs: {
            name: 'chunk-libs',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          elementUI: {
            name: 'chunk-elementUI',
            priority: 20,
            test: /[\\/]node_modules[\\/]_?element-ui(.*)/
          },
          commons: {
            name: 'chunk-commons',
            test: resolve('src/components'),
            minChunks: 3,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      })
    })
  }
})
