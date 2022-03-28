<template>
  <div>
    <!-- <div class="loading"><h1>HELLO WORLD</h1></div> -->
    <div class="loading" v-if="loading">
      <v-progress-circular
        indeterminate
        color="blue"
        size="72"
      ></v-progress-circular>
    </div>

    <div class="select--stock">
      <h3>Select a stock</h3>
      <v-select
        v-model="stocks"
        :items="items"
        item-text="name"
        item-value="id"
        label="Stocks"
        return-object
        outlined
      ></v-select>
    </div>

    <trading-vue
      :data="this.$data"
      :width="this.width"
      :height="this.height"
      ref="tradingVue"
    ></trading-vue>
    <div class="data" v-if="apiData.length > 0">
      <h4>Current price: {{ apiData[apiData.length - 1][4] }}</h4>
      <!-- Price, 7-week change (price + %), 1-year change (price + %), Previous Close  -->
    </div>
  </div>
</template>
<script>
import { TradingVue } from "trading-vue-js";
import { EMA, RSI } from "technicalindicators";
var axios = require("axios");

let data = [];

const trades = [
  // [1583483331000, 0, 1.1249],
  // [1583483391000, 0, 1.12554],
  // [1583483511000, 0, 1.1259],
  // [1583483571000, 0, 1.12685],
  // [1583483751000, 0, 1.12714],
  // [1583483791000, 0, 1.12757],
  // [1583484831000, 0, 1.12783],
  // [1583484831000, 0, 1.12783],
  // [1583487291000, 0, 1.12826],
  // [1583487291000, 0, 1.12826],
  // [1583487651000, 0, 1.12852],
  // [1583487651000, 0, 1.12852],
  // [1583487711000, 0, 1.12879],
  // [1583487711000, 0, 1.12879],
  // [1583487831000, 0, 1.12892],
  // [1583487831000, 0, 1.12892],
  // [1583488351000, 0, 1.12908],
  // [1583488351000, 0, 1.12908],
  // [1583488671000, 0, 1.12952],
  // [1583488671000, 0, 1.12952],
  // [1583489031000, 0, 1.12989],
  // [1583489031000, 0, 1.12989],
  // [1583489151000, 0, 1.13054],
  // [1583489151000, 0, 1.13054],
  // [1583501820000, 1, 1.13069],
];

const lines = [];
// trades.forEach((t, i) => {
//   if (i === trades.length - 1) {
//     return;
//   }

//   lines.push({
//     name: "line_" + i,
//     type: "Segment",
//     data: [],
//     settings: {
//       p1: [t[0], t[2]],
//       p2: [trades[trades.length - 1][0] + 3600000, t[2]],
//       color: t[1] === 1 ? "green" : "red",
//     },
//   });
// });

export default {
  name: "app",
  components: { TradingVue },

  data() {
    return {
      items: [
        { name: "Apple", id: "AAPL" },
        {
          name: "Tesla",
          id: "TSLA",
        },
        { name: "IBM", id: "IBM" },
      ],
      loading: false,
      stocks: "",
      apiData: [],
      prediction: false,
      titleText: "Market Manipulator2k",
      width: window.innerWidth - 20,
      height: window.innerHeight - 20,
      ohlcv: data,
      onchart: [
        {
          name: "EMA 9",
          type: "EMA",
          data: [],
          settings: { color: "white" },
        },
        {
          name: "EMA 20",
          type: "EMA",
          data: [],
          settings: { color: "yellow" },
        },
        {
          name: "EMA 50",
          type: "EMA",
          data: [],
          settings: { color: "purple" },
        },
        {
          name: "EMA 200",
          type: "EMA",
          data: [],
          settings: { color: "orange" },
        },
        {
          name: "Trades",
          type: "Trades",
          data: trades,
          settings: {
            markerSize: 12,
          },
        },
        ...lines,
      ],
      offchart: [{ name: "RSI", type: "RSI", data: [] }],
    };
  },
  methods: {
    async fetchData(id) {
      return await axios.request({
        method: "GET",
        url:
          "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" +
          id +
          "&interval=5min&apikey=2BE85W95139F18CL&outputsize=full",
      });
    },
    async insertData(id) {
      this.apiData = [];
      const res = await this.fetchData(id);
      for (const [timestamp, value] of Object.entries(
        res.data["Time Series (5min)"]
      )) {
        let date = new Date(timestamp);
        this.apiData.push([
          date.getTime(),
          parseFloat(value["1. open"]),
          parseFloat(value["2. high"]),
          parseFloat(value["3. low"]),
          parseFloat(value["4. close"]),
        ]);
      }
      this.apiData.reverse();
      this.ohlcv = this.apiData;

      this.prediction = this.candleStickPred();

      const closeData = [];
      this.apiData.forEach((d) => closeData.push(d[4]));

      const ema9Data = new EMA.calculate({ period: 9, values: closeData });
      this.apiData.forEach((d, i) => {
        const emad = i > 9 ? ema9Data[i - 9] : undefined;
        this.onchart[0].data.push([d[0], emad]);
      });

      const ema20Data = new EMA.calculate({ period: 20, values: closeData });
      this.apiData.forEach((d, i) => {
        const emad = i > 20 ? ema20Data[i - 20] : undefined;
        this.onchart[1].data.push([d[0], emad]);
      });

      const ema50Data = new EMA.calculate({ period: 50, values: closeData });
      this.apiData.forEach((d, i) => {
        const emad = i > 50 ? ema50Data[i - 50] : undefined;
        this.onchart[2].data.push([d[0], emad]);
      });

      const ema200Data = new EMA.calculate({ period: 200, values: closeData });
      this.apiData.forEach((d, i) => {
        const emad = i > 200 ? ema200Data[i - 200] : undefined;
        this.onchart[3].data.push([d[0], emad]);
      });

      var inputRSI = {
        values: closeData,
        period: 14,
      };
      const rsiData = RSI.calculate(inputRSI);
      RSI.calculate(inputRSI);
      this.apiData.forEach((d, i) => {
        const emad = i > 14 ? rsiData[i - 14] : undefined;
        this.offchart[0].data.push([d[0], emad]);
      });

      this.$refs.tradingVue.resetChart();
    },
    candleStickPred() {
      for (let i = 1; i <= 3; i++) {
        let v =
          this.apiData[this.apiData.length - i][4] -
          this.apiData[this.apiData.length - i][1];

        if (parseFloat(v) <= 0) {
          return false;
        }
      }
      return true;
    },
    async updateData(id) {
      this.loading = true;
      await this.insertData(id);
      this.loading = false;
    },
  },
  created() {
    // this.insertData();
  },
  mounted() {},
  watch: {
    stocks() {
      this.updateData(this.stocks.id);
    },
  },
};
</script>
<style>
.select--stock {
  position: absolute;
  z-index: 10;
  left: 85vw;
  top: 2vh;
  max-width: 10rem;
}
.loading {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 11;
}
</style>
