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

ontentbase代表html頁面所在的相對目錄，如果我們不配置項，devServer默認html所在的目錄就是項目的根目錄，並不會看見html頁面，相反展現在我們面前的時項目根目錄文件夾，因為我們根目錄下根本沒有html文件。

html在編譯後實際是在dist目錄下，所以我們需要這樣配置

```js
 devServer: {
     contentBase: 'dist', // since we use CopyWebpackPlugin.
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
