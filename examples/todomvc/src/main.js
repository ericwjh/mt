import Vue from 'vue'
import App from './App'

/* eslint-disable no-new */
var app = new Vue({
  el: '#app',
  template: '<App/>',
  components: { App }
})

// handle routing
function onHashChange () {
  var visibility = window.location.hash.replace(/#\/?/, '')
  // if (filters[visibility]) {
  //   app.visibility = visibility
  // } else {
    window.location.hash = ''
    app.visibility = 'all'
  // }
}

window.addEventListener('hashchange', onHashChange)
onHashChange()
