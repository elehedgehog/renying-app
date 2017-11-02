<template>
  <div id="map-container" style="width: 100%; height: 100%"></div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import mapLayerConf from '../config/mapLayersConf'

export default {
  data () {
    return {
      
    }
  },

  mounted() {
    let zmap = window.zmap = L.map('map-container', {
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });
    L.tileLayer(mapLayerConf.terrain).addTo(zmap);
    zmap.setView([23.085, 113.154033], 8);
  }
}
</script>

<style lang="scss" scoped>
#map-container {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 0;
}
</style>
