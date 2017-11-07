<template>
  <div id="WeatherReal">
    <zmap />
    <div class="WeatherReal_time">
      <ul>
        <li v-for="(el, key) in radarProduct" :key="key" v-if="el.time" :class="{'no-data': !el.layer}">
          {{ el.time + ' ' + el.text + (el.layer ? '' : ' NO DATA') }}
        </li>
      </ul>
    </div>
    <div class="canvas-wrapper scrollbar" v-show="productSelected === 'vwp'">
      <canvas height="695px" id="WindRadarCanvas" width="900px"></canvas>
    </div>
    <div class="WeatherReal_con">
      <div :class="['WeatherReal_con_header', {canvas: productSelected === 'vwp'}]">
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
      <div class="WeatherReal_con_product"  v-show="productSelected === 'station'">
        <div class="vwp_subtitle"><p>站点类型</p></div>
        <ul class="vwp_content station_type">
          <li v-for="(item, key) in stationType" :key="key" :class="{'on': item.show}" @click="toggleStationType(key)">{{ item.text }}</li>
        </ul>
        <div class="vwp_subtitle"><p>实况监测</p></div>
        <ul class="vwp_content vwp_product">
          <li v-for="(item, key) in realType" :key="key" :class="{'on': item.show}" @click="toggleReal(key)">{{ item.cname }}</li>
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
import WindRadarDrawer from '../util/windRadarUtil'
import { getVelLevel } from '../util/windHelper'

let realInfo = {}         // 存储站点数据

export default {
  data () {
    return {
      moment: moment,
      radarPopup: false,
      radarProduct: {
        cappi3: { text: 'CAPPI3 公里', selected: false, url: this.getRadarUrl('cappi', 3), layer: null, time: null },
        mtop: { text: '回波顶高', selected: false, url: this.getRadarUrl('mtop'), layer: null, time: null },
        cappi1: { text: 'CAPPI1 公里', selected: false, url: this.getRadarUrl('cappi', 1), layer: null, time: null },
        mcr: { text: '组合反射率', selected: false, url: this.getRadarUrl('mcr'), layer: null, time: null },
        cappi5: { text: 'CAPPI5 公里', selected: false, url: this.getRadarUrl('cappi', 5), layer: null, time: null },
        vil: { text: 'VI:液态降水', selected: false, url: this.getRadarUrl('mvil'), layer: null, time: null },
        titan: { text: '雷暴跟踪', selected: false, url: 'http://10.148.83.228:8922/dataunit/titan/renderTitan/?datetime={datetime}&top=27&bottom=18.2&left=108.5&right=119&width=2000&height=2000', layer: null, time: null },
        // hail: { text: '冰雹', selected: false, url: '', layer: null, time: null },
      },
      productSelected : 'radar',
      bounds: [[27, 108.5], [18.2, 119]],

      radarTypeList: ['ROBS', 'HOBS', 'OOBS'],
      typeSelected: 'ROBS',
      radar: [],
      radarSelected: '',

      stationType:  {
        gdAuto: { text: '广东自动站', show: false, param: 'A' },    // param对应 链接中的字段
        gdArea: { text: '广东区域站', show: false, param: 'B' },
        // gpsSteam: { text: 'GPS水汽站', show: false, param: 'g' },
      },
      realType:  {
        temp: { show: false, cname: '温度', unit: '℃' ,classname: 'temp'},
        ps: { show: false, cname: '气压', unit: 'pa' ,classname: 'ps'},
        hourrf: { show: false, cname: '降水', unit: 'mm' ,classname: 'hourrf'},
        dp: { show: false, cname: '露点温度', unit: '℃' ,classname: 'dp' },
        wind: { show: false, cname: '风力风向', unit: 'm/s' ,classname: 'wind'},
        rh: { show: false, cname: '相对湿度', unit: '%' ,classname: 'rh'},
        // mean31_pwv : { show: false, cname: 'GPS水汽', unit: '' ,classname: 'water'},
      },

    }
  },
  mounted() {
    
  },
  components: {
    Zmap
  },

  methods: {
    getRadarUrl(element, level) {
      return `http://10.148.83.228:8922/dataunit/temporary/renderTemporaryData?type=swan&datetime={datetime}&element=${element}&time=0&level=${level ? level : 0}&top=27&bottom=18.2&left=108.5&right=119&width=2000&height=2000`
    },
    async toggleProduct(key) {
      if(key === this.productSelected) return
      this.productSelected = key
      if (key === 'vwp') {
        this.typeSelected = 'ROBS'
        if (!this.radar.length)
          await this.initRadarData()
        else
          this.initRadarSelected()
        this.getRadarData()
      }
    },

    /**  短临产品   */
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
          let time = Date.now() - Date.now() % (6 * 60 * 1000)
          this.radarProduct[key].time = moment(time).format('YYYY-MM-DD HH:mm')
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
      this.radarProduct[key].time = null
      if (!this.radarProduct[key].layer) return
      map.removeLayer(this.radarProduct[key].layer)
      this.radarProduct[key].layer = null
    },

    /**  风廓线   */
    async initRadarData() {         // 获取雷达站点
      let res = await axios({
        url: 'http://10.148.16.217:11160/renyin5/radar/windprofile/lls',
        adapter: jsonp
      })
      if (res.data.stateCode !== 0) {
        this.$message({
          message: '获取雷达数据出错',
          type: 'error'
        })
        return
      }
      this.radar = res.data.data
      this.initRadarSelected()
    },
    initRadarSelected() {         // 初始化所选雷达站点
      for (let el of this.radar) {
        if (el.addr !== 'null') {
          this.radarSelected = el.obtid
          break
        }
      }
    },
    async getRadarData() {      // 获取数据 绘制风廓线
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
        this.$message({
          message: '数据出错,请切换时次再试',
          type: 'warning'
        })
        return
      }
      let drawer = new WindRadarDrawer('multiple', 'WindRadarCanvas')
      drawer.setDrawType('single')
      drawer.setData(res.data.data)
      let radarCname = ''
      for(let item of this.radar){
        if(item.obtid === this.radarSelected) {
          radarCname = item.addr
          break
        }
      }
      drawer.draw(moment().format('YYYY-MM-DD HH:mm'), '雷达站:' + radarCname)
    },
    toggleType(key) {           // 修改雷达类型
      if(key !== this.typeSelected) {
        this.typeSelected = key
        this.getRadarData()
      }
    },
    toggleCity(key) {          // 修改雷达位置
      if(key !== this.radarSelected) {
        this.radarSelected = key
        this.getRadarData()
      }
    },

    /** 自动站  */
    async toggleStationType(key) {
      this.stationType[key].show = !this.stationType[key].show
      if(this.stationType[key].show) {
        if (!realInfo[key]) {
          let res = await axios(`http://10.148.83.228:8922/dataunit/station/findStationInfo?types[]=${this.stationType[key].param}&provinces[]=广东`)
         let data = res.data
          if (!data) {
            this.$message({
              message: '站点数据获取失败',
              type: 'error'
            })
            return
          }
          let obj = {}
          for (let item of data) {
            obj[item.id] = item
          }
          realInfo[key] = obj
        }
        this.getProduct(key)
      } else {
        this.removeLayer(key)
      }
    },
    async getProduct(key) {
      for (let i in realInfo[key]) {
        realInfo[key][i].datetime = null
        realInfo[key][i].elems = null
      }
      let datetime = moment().subtract(1, 'hours').format('YYYY-MM-DD HH:mm:00')
      let url = `http://10.148.83.228:8922/dataunit/station/findStationData?types[]=${this.stationType[key].param}&datetime=${datetime}&elements[]=temp&elements[]=ps&elements[]=hourrf&elements[]=dp&elements[]=wd2df&elements[]=wd2dd&elements[]=rh&elements[]=mean31_pwv&provinces[]=广东`
      let res = await axios(url)
      let msg = res.data
      if (!msg) {
        this.$message({
          message: '实况数据获取失败',
          type: 'error'
        })
        return
      }
      if (!msg.length) {
        this.$message({
          message: '实况数据获取失败',
          type: 'error'
        })
      }
      for (let opt of msg) {
        let id = opt.id
        if (realInfo[key][id]) {
          realInfo[key][id].datetime = opt.datetime
          realInfo[key][id].elems = opt.elems
        }
      }
      // 添加已选中实况元素数据
      for (let i in this.realType) {
        if (this.realType[i].show) {
          if (i === 'wind')
            this.addWind(key, realInfo[key])
          else
            this.addReal(key, i, realInfo[key])
        }
      }
    },
    // 添加站点风力风向数据
    addWind(type, data) {
      this.removeLayer(type + '_wind')
      let markers = new L.layerGroup(), angleMarkers = new L.layerGroup()
      for (let i in data) {
        let opt = data[i]
        if (!opt.elems) continue
        let angleMarker = L.angleMarker([opt.loc.lat, opt.loc.lon], {
          icon: new L.Icon({
            iconUrl: `static/wind/${getVelLevel(opt.elems.wd2df)}.png`,
            iconSize: [27, 48],
            iconAnchor: [0, 48]
          }),
          iconAngle: opt.elems.wd2dd,
          iconOrigin: '0% 100%',
          zIndexOffset: -1
        })

        let opts = L.divIcon({
          className: 'divIcon-wind',
          html: `<span class='wind'>${Math.floor(opt.elems.wd2df * 100) / 100} ${this.realType.wind.unit}</span>`
        })
        let marker = L.marker([opt.loc.lat, opt.loc.lon], { icon: opts })           // 风速

        if (type === 'gdArea') {
          angleMarkers.addLayer(angleMarker)
          markers.addLayer(marker)
        } else {
          angleMarker.id = type + '_wind'
          angleMarker.addTo(map)
        }
      }
      if (type === 'gdArea') {
        angleMarkers.id = type + '_wind'
        map.addLayer(angleMarkers)
      }
    },
    // 添加站点实况数据
    addReal(type, key, data) {
      this.removeLayer(type + '_' + key)
      let markers = new L.layerGroup()
      for (let i in data) {
        let opt = data[i]
        if (!opt.elems || opt.elems[key] === undefined || opt.elems[key] > 8888 ||
          opt.elems[key] < -8888) continue
        const opts = L.divIcon({
          className: `divIcon-${key}`,
          html: `<span class="${this.realType[key].classname}">${Math.floor(opt.elems[key] * 100) / 100} ${this.realType[key].unit}</span>`
        })
        let marker = L.marker([opt.loc.lat, opt.loc.lon], { icon: opts })
        if (type === 'gdArea') {
          markers.addLayer(marker)
        } else {
          marker.id = type + '_' + key
          marker.addTo(map)
        }
      }
      if (type === 'gdArea') {
        markers.id = type + '_' + key         // 站点类型_元素类型
        map.addLayer(markers)
      }
    },
    // 切换数据显示
    toggleReal(key) {
      this.realType[key].show = !this.realType[key].show
      if (this.realType[key].show) {
        for (let type in realInfo) {
          if (!this.stationType[type].show) continue
          if (key === 'wind')
            this.addWind(type, realInfo[type])
          else
            this.addReal(type, key, realInfo[type])
        }
      } else {
        this.removeLayer(key)
      }
    },
    removeLayer(key) {
      let reg = new RegExp(key)
      map.eachLayer(e => {
        if(reg.test(e.id)) map.removeLayer(e) 
      })
    }

  }
}
</script>

<style lang="scss" scoped>
#WeatherReal {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
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
    ul {
      background: #fff;
      border-radius: 5px;
      box-shadow: 0 0 0.052083rem #8d9db5;
      li {
        color: #1c1c1c;
        font-size: 28px;
        line-height: 40px;
        padding: 0 10px;
        white-space: nowrap;
        &.no-data { color: #f00; }
      }
    }
  }
  .canvas-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: calc(100% - 420px);
    background: #fff;
    overflow: auto;
    #WindRadarCanvas {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
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
      &.canvas { border-top: 1px solid #121213; }
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
    .WeatherReal_con_vwp,.WeatherReal_con_product{
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
      ul.station_type{
        li{ margin-right: 20px;}
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

<style lang="scss">
  #WeatherReal {
    @mixin wind() {
    div{
        height: 30px !important;
        width: 30px !important;
        display: block;
        height: 100%;
        width: 100%;
        border-radius: 50%;
        background-position: center center;
        background-repeat: no-repeat;
    }
  }

  @mixin divIcon-mix() {
    div{
        display: block;
        color: black;
        border-radius: 50%;
        font-size: 12px;
        text-align: center;
        opacity: .8;
    }
  }

  .divIcon-wind{
    @include wind()
  }

  .divIcon-cluster{
    @include divIcon-mix()
  }
  .divIcon{
    width: auto !important;
    height: auto !important;
  }

  .divIcon-temp{
    color: #00A0E9;
    white-space: nowrap;
    font-size: 26px;
  }
  .divIcon-ps{
    color: #10C469;
    white-space: nowrap;
    font-size: 26px;
  }
  .divIcon-hourrf{
    color: #58CDC7;
    white-space: nowrap;
    font-size: 26px;
  }
  .divIcon-dp{
    color: #FF5B5B;
    white-space: nowrap;
    font-size: 26px;
  }
  .divIcon-wind{
    color: #bf9123;
    white-space: nowrap;
    font-size: 26px;
  }
  .divIcon-rh{
    color: #ED5589;
    white-space: nowrap;
    font-size: 26px;
  }
  .divIcon-water{
    color: #5B69BC;
    white-space: nowrap;
    font-size: 26px;
  }
  .temp{
    position: absolute;
    top: -20px;
    font-size: 26px;
  }
  .ps{
    position: absolute;
    top: -5px;
    left: 18px;
    font-size: 26px;
  }
  .hourrf{
    position: absolute;
    top: 10px;
    left: 15px;
    font-size: 26px;
  }
  .dp{
    position: absolute;
    top: 20px;
    left: -10px;
    font-size: 26px;
  }
  .wind{
    position: absolute;
    top: 10px;
    left: -30px;
    font-size: 26px;
  }
  .rh{
    position: absolute;
    top: -2px;
    left: -35px;
    font-size: 26px;
  }
  .water{
    position: absolute;
    top: -13px;
    left: -35px;
    font-size: 26px;
  }

}
</style>
