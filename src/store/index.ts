import Vue from 'vue'
import Vuex from 'vuex'
import Url from '@/Config/urls'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    authResult: sessionStorage.getItem("authResult") ? JSON.parse(sessionStorage.getItem("authResult") as any) : { user: null, token: null, description: null }
  },
  mutations: {
    ["Login"](state, authResult) {
      state.authResult = authResult;

      sessionStorage.setItem("authResult", JSON.stringify(authResult))
    },
    ["Logout"](state) {
      state.authResult = { user: null, token: null, description: null };
      sessionStorage.removeItem("authResult")
    }
  },
  modules: {
  },
  getters: {
    user: state => state.authResult.user,
    token: state => state.authResult.token,
  },
  actions: {
    ["Login"]({ commit }, model) {
      return new Promise((resolve, reject) => {
        try {
          const requestConfig = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(model)
          };
          fetch(Url.ApiURL + "/Auth", requestConfig)
            .then(resp => resp.json())
            .then((response) => {
              if (!response.user) {
                alert(response.description);
                reject(response.description)
              }
              commit("Login", response)
              resolve(response)
            }).catch(err => reject(err));
        } catch (error) {
          reject(error)
        }
      })
    },
    ["Logout"]({ commit }) {
      return new Promise((resolve, reject) => {
        try {
          commit("Logout");
          resolve("Ok");
        } catch{
          reject("An error has occurred")
        }
      })
    }
  }
})
