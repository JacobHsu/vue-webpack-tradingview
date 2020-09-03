# vue-webpack-tradingview

> A Vue.js project

`vue init webpack vue-webpack-tradingview`

```js
cd vue-webpack-tradingview
npm run dev
```

## Debug

> Uncaught TypeError: c.contentWindow.widgetReady is not a function at HTMLIFrameElement.g (charting_library.min.js?a524:11)

build\webpack.dev.conf.js

關閉 contentBase

```js
const CopyWebpackPlugin = require('copy-webpack-plugin')
 devServer: {
    hot: true,
    // contentBase: false, // since we use CopyWebpackPlugin.
```

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
