// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'

import './util/fontSize'
Vue.config.productionTip = false
import 'element-ui/lib/theme-chalk/index.css'
import {
  Message,
  MessageBox,
} from 'element-ui'
Vue.prototype['$message'] = Message
Vue.prototype['$confirm'] = MessageBox.confirm
Vue.directive('focus', {
  inserted: function (el) {
    el.focus()
  },
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
