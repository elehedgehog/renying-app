<template>
  <div id="WeatherReal">
    <zmap />
    <div class="WeatherReal_time">
      <ul><li v-for="(el, key) in radarProduct" :key="key" v-if="el.time">{{ el.time + el.text }}</li></ul>
    </div>
    <canvas height="695px" id="WindRadarCanvas" width="900px"></canvas>
    <div class="WeatherReal_con">
      <div class="WeatherReal_con_header">
        <ul>
          <li :class="[{'on': productSelected === 'radar'}, 'radar']"><em @click="toggleProduct('radar')"></em></li>
          <li :class="[{'on': productSelected === 'vwp'},'vwp']"><em @click="toggleProduct('vwp')"></em></li>
          <li :class="[{'on': productSelected === 'station'},'station']"><em @click="toggleProduct('station')"></em></li>
        </ul>
      </div>
      <div class="WeatherReal_con_radar" v-show="productSelected === 'radar'">
        <ul>
          <li :class="{on: item.selected}" v-for="(item, key) in radarProduct" :key="key" @click="toggleRadar(key)"> {{ item.text }}</li>
        </ul>
      </div>
      <div class="WeatherReal_con_vwp" v-show="productSelected === 'vwp'">
        <div class="vwp_subtitle"><p>雷达类型</p></div>
        <ul class="vwp_content vwp_type">
          <li v-for="item in radarTypeList" :key="item" :class="{'on': typeSelected === item}" @click="toggleType(item)">{{ item }}</li>
        </ul>
        <div class="vwp_subtitle"><p>选择雷达</p></div>
        <ul class="vwp_content vwp_city">
          <li v-for="item in radar" :key="item.obtid" :class="{'on': radarSelected === item.obtid}" @click="toggleCity(item.obtid)" v-if="item.addr !== 'null'">{{ item.addr }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import Zmap from './Zmap.vue'
import moment from 'moment'
import axios from 'axios'
import jsonp from 'axios-jsonp'

export default {
  data () {
    return {
      moment: moment,
      radarPopup: false,
      radarProduct: {
        cappi3: { text: 'CAPPI3 公里', selected: false, url: this.getRadarUrl('cappi', 3), layer: null, time: null },
        echoHeight: { text: '回波顶高', selected: false, url: this.getRadarUrl('mtop'), layer: null, time: null },
        cappi1: { text: 'CAPPI1 公里', selected: false, url: this.getRadarUrl('cappi', 1), layer: null, time: null },
        reflex: { text: '组合反射率', selected: false, url: this.getRadarUrl('mcr'), layer: null, time: null },
        cappi5: { text: 'CAPPI5 公里', selected: false, url: this.getRadarUrl('cappi', 5), layer: null, time: null },
        vil: { text: 'VI:液态降水', selected: false, url: this.getRadarUrl('mvil'), layer: null, time: null },
        // titan: { text: '雷暴跟踪（TITAN）', selected: false, url: '', layer: null, time: null },
        // hail: { text: '冰雹', selected: false, url: '', layer: null, time: null },
      },
      productSelected : 'radar',
      bounds: [[27, 108.5], [18.2, 119]],

      radarTypeList: ['ROBS', 'HOBS', 'OOBS'],
      typeSelected: 'ROBS',
      radar: [],
      radarSelected: '',

    }
  },
  async mounted() {
    await this.initRadarData()
    this.getRadarData()
  },
  components: {
    Zmap
  },

  methods: {
    getRadarUrl(element, level) {
      return `http://10.148.83.228:8922/dataunit/temporary/renderTemporaryData?type=swan&datetime={datetime}&element=${element}&time=0&level=${level ? level : 0}&top=27&bottom=18.2&left=108.5&right=119&width=2000&height=2000`
    },
    
    toggleProduct(key) {
      if(key === this.productSelected) return
      this.productSelected = key
      this.typeSelected = 'ROBS'
    },
    toggleRadar(key) {
      this.radarProduct[key].selected = !this.radarProduct[key].selected
      if (this.radarProduct[key].selected) {
        this.getRadarImageUrl(key)
        .then(url => {
          if (!this.radarProduct[key].selected) return
          let layer = L.imageOverlay(url, this.bounds)
          layer.addTo(map)
          this.radarProduct[key].layer = layer
        })
        .catch(err => {
          Vue.prototype['$message']({
            type: 'warning',
            message: '该时暂无数据'
          })
        })
      } else {
        this.removeRadarImageLayer(key)
      }
    },
    getRadarImageUrl(key) {
      return new Promise((resolve, reject) => {
        const getImage = (i) => {
          let date = Date.now() - Date.now() % (6 * 60 * 1000) - i * 6 * 60 * 1000
          let datetime = moment(date).format('YYYY-MM-DD HH:mm:00')
          let url = this.radarProduct[key].url.replace('{datetime}', datetime)
          let img = new Image()
          img.onload = () => {
            this.radarProduct[key].time = moment(datetime).format('YYYY-MM-DD HH:mm')
            resolve(url)
          }
          img.onerror = () => {
            if (i < 10) getImage(++i)
            else reject()
          }
          img.src = url
        }
        getImage(0)
      })
    },
    removeRadarImageLayer(key) {
      if (!this.radarProduct[key].layer) return
      map.removeLayer(this.radarProduct[key].layer)
      this.radarProduct[key].layer = null
      this.radarProduct[key].time = null
    },
    toggleType(key) {
      if(key !== this.typeSelected)
        this.typeSelected = key
    },
    toggleCity(key) {
      if(key === this.radarSelected)  return
      this.radarSelected = key
    },
    async initRadarData() {
      let res = await axios({
        url: 'http://10.148.16.217:11160/renyin5/radar/windprofile/lls',
        adapter: jsonp
      })
      if (res.data.stateCode !== 0) {
        // Message({
        //   type: 'warning',
        //   message: '获取雷达数据出错'
        // })
        return
      }
      this.radar = res.data.data
      for (let el of this.radar) {
        if (el.addr !== 'null') {
          this.radarSelected = el.obtid
          break
        }
      }
    },
    async getRadarData() {
      let params = {
        time: moment().format('YYYY-MM-DD HH:mm:00'),
        interval: 30,
        num: 5,
        obtid: this.radarSelected,
        proid: this.typeSelected
      }
      let res = await axios({
        url: 'http://10.148.16.217:11160/renyin5/radar/windprofile/rpoints',
        adapter: jsonp,
        params
      })
      if (res.data.stateCode !== 0) {
        // Message({
        //   type: 'warning',
        //   message: '数据出错,请切换时次再试'
        // })
        return
      }
      console.log(res)
    },


  }
}
</script>

<style lang="scss" scoped>
#WeatherReal {
  width: 100%;
  height: 100%;
  ul{
    li{
      list-style: none;
    }
  }
  .WeatherReal_time {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    font-size: 28px;
    ul {
      li {
        padding: 0 10px;
        white-space: nowrap;
      }
    }
  }
  .WeatherReal_con {
    position: absolute;
    bottom: 0;
    left: 0px;
    width: 100%;
    background: #fff;
    font-size: 14px;
    .WeatherReal_con_header{
      height: 100px;
      border-bottom: 1px solid #DFE0E4;
      ul{
        width: 70%;
        height: 100px;
        margin: 0 auto;
        li{
          position: relative;
          float: left;
          width: calc(100% / 3);
          margin-top: 15px;
          em{
            position: relative;
            left: 50%;
            transform: translateX(-50%); 
            display: inline-block;
            border-radius:70px;
            height: 70px;
            width: 70px; 
            background-color: #e1e7f0;
            &:after{
              position: absolute;
              content: '';
              display: inline-block;
            }
          }
          &.on{
             &.radar{
               em{
                 background-color: #11a9f5;
               }
            }
            &.station{
              em{
                 background-color: #f26747;
               }
            }
            &.vwp{
              em{
                background-color: #f7c231;
              }
            }
            }
            &.radar{
              em:after{ 
                top: 23px;
                left: 23.5px;
                width: 23px;
                height: 24px;
                background: url(~Img/home_radar.png)no-repeat 0 0/100% 100%;
                }
            }
            &.vwp{
              em:after{
                top: 17.5px;
                left: 25px; 
                width: 20px;
                height: 35px;
                background: url(~Img/home_vwp.png)no-repeat 0 0/100% 100%; 
                }
          }
          &.station{
              em:after{ 
                top: 23.5px;
                left: 23px;
                width: 21px;
                height: 31px;
                background: url(~Img/home_station.png)no-repeat 0 0/100% 100%; 
                }
          }
        }
      }
    }
    .WeatherReal_con_radar{
      font-size: 28px;
      color: #989898;
      ul{
        overflow-x: auto;
        max-width: 2000px;
        height: 130px;
        padding:0  40px;
        white-space: nowrap;
        li{
          line-height: 50px;
          margin-right: 20px;
          margin-top: 35px;
          padding: 0 10px;
          // width: 170px;
          // text-align: center;
          display: inline-block;
          border-radius: 60px;
           border: 1px solid #fff;
          &.on{
            border: 1px solid #4787e1;
            color: #4787e1;
          }
        }
      }
    }
    .WeatherReal_con_vwp{
      height: 320px;
      font-size: 28px;
      .vwp_subtitle{
        height: 70px;
        line-height: 70px;
        color: #1c1c1c;
        p{
          padding-left: 40px;
        }

      }
      ul.vwp_content{
        height: 90px;
        padding: 0 40px;
        overflow-x: auto;
        max-width: 2000px;
        padding:0  40px;
        white-space: nowrap;
        li{
          line-height: 50px;
          margin-right: 10px;
          margin-top: 20px;
          padding: 0 10px;
          display: inline-block;
          border-radius: 60px;
          border: 1px solid #fff;
          color: #989898;
          &.on{
            border: 1px solid #4787e1;
            color: #4787e1;
          }
        }
      }
      ul.vwp_city{
        li{
          width: 100px;
          text-align: center;
        }
      }
      ul.vwp_type{
        li{
          margin-right: 80px;
          width: 100px;
          text-align: center;
        }
      }
    }
  }
  .scrollbar::-webkit-scrollbar { 
    width: 6px;
    height: 6px;
  }
  .scrollbar::-webkit-scrollbar-thumb {
    background: #B4B6BF;
    border-radius: 3px;
  }
  .scrollbar{
    scrollbar-arrow-color: #B4B6BF;
    /*滚动条滑块按钮的颜色*/
    scrollbar-face-color: #B4B6BF;
    /*滚动条整体颜色*/
    scrollbar-highlight-color: #B4B6BF;
    /*滚动条阴影*/
    scrollbar-shadow-color: #ccc;
    /*滚动条轨道颜色*/
    scrollbar-track-color: #fff;
  }
}
</style>
