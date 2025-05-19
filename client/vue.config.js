const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      "^/api*": {
        ws: true,
        changeOrigin: true,
        target: "http://localhost:3000",
      },
    },
  },
});
