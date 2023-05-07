const { defineConfig } = require('@vue/cli-service')

// add require for fs node library
const fs = require('fs');

module.exports = defineConfig({
  transpileDependencies: true,
  // tell the Webpack 5 devServer where to find the server key and cert
  devServer: {
      https: {
        key: fs.readFileSync('./ssl/server.key'),
        cert: fs.readFileSync('./ssl/server.crt'),
      }
    }
})