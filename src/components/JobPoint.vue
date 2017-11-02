<template>
  <main id="JobPoint">
    <zmap />
  </main>
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

  methods: {

  },

  watch: {
    // a(val, oldVal) {

    // }
  }
}
</script>

<style lang="scss" scoped>
#JobPoint {
  width: 100%;
  height: 100%;
}
</style>
