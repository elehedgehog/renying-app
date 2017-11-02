<template>
  <div id="WeatherReal">
    <zmap />
  </div>
</template>

<script>
import Zmap from './Zmap.vue'

export default {
  data () {
    return {
      
    }
  },

  components: {
    Zmap
  },
}
</script>

<style lang="scss" scoped>
#WeatherReal {
  width: 100%;
  height: 100%;
  nav {
    position: absolute;
    top: 100px;
    left: 100px;
    width: 200px;
    height: 200px;
    background: #000;
  }
}
</style>
