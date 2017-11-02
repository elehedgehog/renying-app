import Vue from 'vue'
import Router from 'vue-router'
import WeatherReal from '@/components/WeatherReal'
import JobPoint from '@/components/JobPoint'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '',
      name: 'WeatherReal',
      component: WeatherReal
    },
    {
      path: '/jobpoint',
      name: 'JobPoint',
      component: JobPoint
    }
  ]
})
