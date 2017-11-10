<template>
  <main id="JobPoint">
    <zmap />
    <div>
       <input type="text" class="jobPoint_search" 
              v-model="jobPoint" 
              :placeholder="placeholderPoint" 
              @focus="placeholderPoint = ' '" 
              @blur="placeholderPoint = '输入作业点'">
        <ul class="jobPoint_list" v-show="jobPoint">
          <li v-for="(item,key) in jobPointList" :key="key" @click="searchJobPolint(item)" v-show="item.show">
            <span :title="item.opId">{{ item.opId }}</span>
            <span :title="item.city">{{ item.city }}</span>
            <span :title="item.town">{{ item.town }}</span>
          </li>
        </ul>
    </div>
  </main>
</template>

<script>
import Zmap from './Zmap.vue'
import moment from 'moment'
import axios from 'axios'
import jsonp from 'axios-jsonp'
export default {
  data () {
    return {
      jobPoint: '',
      placeholderPoint: '输入作业点', 
      jobPointList: [],
    }
  },

  components: {
    Zmap
  },
  mounted() {
    this.getJobPoint() 
    this.hideDivIcon()
  },
  methods: {
    async getJobPoint() {
      let res = await axios({
        url:`http://10.148.16.217:11160/renyin5/fp/operation/finds`,
        adapter: jsonp
      })
      if (res.data.stateCode !== 0) {
        this.$message({
          message: '获取作业点数据出错',
          type: 'error'
        })
        return
      }
      let arr = res.data.data
      for (let el of arr) {
        this.$set(el, 'show', true)
      }
      this.jobPointList = arr
      console.log(this.jobPointList)

      const stationIcon = L.icon({
          className: 'airdromePonit',
          iconUrl: './static/img/station.png',
          iconSize: [50, 50],
          iconAnchor: [25, 25],
      })
      let markers = new L.layerGroup()
      for (let item of this.jobPointList) {
        let divIcon = L.marker([item.lat, item.lon], { icon: stationIcon })

        divIcon.on('click', e => {
          android.pushLonlat(item.lat, item.lon, item.opId);
          console.log(item.lat, item.lon)
        })

        markers.addLayer(divIcon)
        let marker = L.marker([item.lat, item.lon], { 
          icon: L.divIcon({
            className: `divIcon`,
            html: `<span class="job_point">${ item.town }</span>`
          })
        })
         markers.on('click', e => {
          android.pushLonlat(item.lat, item.lon, item.opId);
        })
        markers.addLayer(marker)
      }
      markers.id = 'jobPonits'
      map.addLayer(markers)
    },
    hideDivIcon(){
        // 缩放地图隐藏名称框
      map.on('zoomend', () => {           
        const zoom = map._zoom;
        let target = document.querySelectorAll('.divIcon')
        console.log(target)
        if(zoom < 6){
          for (let el of target ) {
           el.style.visibility = 'hidden'
          }  
        } else{
           for (let el of target ) {
             el.style.visibility = 'visible'
          }  
        }
      })
    },
    searchJobPolint(item) {
      map.setView([item.lat, item.lon], 12, { animate: true })
    }
  },


  watch: {
    jobPoint(val, oldVal) {
      for (let el of this.jobPointList) {
        el.show = true
      }
      if (val) {
        let reg = new RegExp(val)
        for (let el of this.jobPointList) {
          el.show = reg.test(el.town) || reg.test(el.opId) || reg.test(el.city)
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
#JobPoint {
  width: 100%;
  height: 100%;
  ul{
    li{
      list-style: none;
    }
  }
  input.jobPoint_search {
    position: absolute;
    left: 50%;
    top: 30px;
    transform: translateX(-50%);
    -webkit-transform: translateX(-50%);
    -moz-transform: translateX(-50%);
    -ms-transform: translateX(-50%);
    -o-transform: translateX(-50%);
    width: 570px;
    height:70px;
    line-height: 70px;
    padding: 0 30px;
    font-size: 28px;
    text-align: center;
    border: none;
    outline: none;
    color: #989898;
    background-color: #fff;
    box-shadow: rgba(31, 43, 61, .4) 0 0 7px 1px;
  }
  ul.jobPoint_list{
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    -webkit-transform: translateX(-50%);
    -moz-transform: translateX(-50%);
    -ms-transform: translateX(-50%);
    -o-transform: translateX(-50%);
    top: 100px;
    width: 570px;
    max-height: 210px;
    padding: 0 30px;
    overflow: auto;
    background-color: #fff;
    font-size: 28px;
    color: #1c1c1c;
    box-shadow: rgba(31, 43, 61, .4) 0 0 1px 1px;
    li{
      height: 70px;
      line-height: 70px;
      span{
        display: inline-block;
        width: 160px;
        margin-right: 20px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        &:nth-child(1){ width: 180px; }
        &:nth-child(2){ width: 120px; }
        &:nth-child(3){ width: 180px; }
      }
    }
  }
  
  
}
</style>
<style lang="scss">
  .job_point{
    position: absolute;
    
    white-space: nowrap;
    font-size: 26px;
  }
  .divIcon{
    position: absolute;
    top: 25px;
    left:-30px;
    display: inline-block;
    min-width: 80px;
    max-width:100px!important;
    height:30px!important;
  }
</style>