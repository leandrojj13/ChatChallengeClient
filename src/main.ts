import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import moment from "vue-moment";

Vue.config.productionTip = false;

router.beforeEach((to, from, next) => {
  if (sessionStorage.getItem("authResult") === null) {
    if (to.path != "/login")
      next("/login");
  }else{
    if (to.path == "/login"){
      next("/");
    }
  }
  next();
});

Vue.use(moment);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
