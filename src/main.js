// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import vueResource from 'vue-resource'
import VueI18n from 'vue-i18n'
import Api from './config/api'

Vue.config.productionTip = false

Vue.use(VueI18n)
Vue.use(vueResource)

const i18n = new VueI18n({
  locale: 'zh',
  messages: {
    zh: require('./assets/lang/zh.js'),
    en: require('./assets/lang/en.js')
  }
})

Vue.prototype.host = 'http://49.234.13.106:8801' // "https://api.xxxx.com"; //BIZZAN

Vue.prototype.api = Api

Vue.http.options.credentials = true
Vue.http.options.emulateJSON = true
Vue.http.options.headers = {
  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  'Content-Type': 'application/json;charset=utf-8'
}

Vue.filter('toFixed', function(number, scale) {
  return Number(number).toFixed(scale)
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  i18n,
  router,
  components: { App },
  template: '<App/>'
})
