<template>
  <trading-vue
    :data="this.$data"
    :width="this.width"
    :height="this.height"
    ref="tradingVue"
  ></trading-vue>
</template>
<script>
import { TradingVue } from "trading-vue-js";
import { EMA } from "technicalindicators";
var axios = require("axios");

var options = {
  method: "GET",
  url: "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=5min&apikey=2BE85W95139F18CL&outputsize=full",
};

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

const closeData = [];
data.forEach((d) => closeData.push(d[4]));

const ema9Data = new EMA.calculate({ period: 9, values: closeData });
const ema9 = [];
data.forEach((d, i) => {
  const emad = i > 9 ? ema9Data[i - 9] : undefined;
  ema9.push([d[0], emad]);
});

const ema20Data = new EMA.calculate({ period: 20, values: closeData });
const ema20 = [];
data.forEach((d, i) => {
  const emad = i > 20 ? ema20Data[i - 20] : undefined;
  ema20.push([d[0], emad]);
});

const ema50Data = new EMA.calculate({ period: 50, values: closeData });
const ema50 = [];
data.forEach((d, i) => {
  const emad = i > 50 ? ema50Data[i - 50] : undefined;
  ema50.push([d[0], emad]);
});

const ema200Data = new EMA.calculate({ period: 200, values: closeData });
const ema200 = [];
data.forEach((d, i) => {
  const emad = i > 200 ? ema200Data[i - 200] : undefined;
  ema200.push([d[0], emad]);
});

export default {
  name: "app",
  components: { TradingVue },

  data() {
    return {
      apiData: [],
      titleText: "Market Manipulator2k",
      width: window.innerWidth - 20,
      height: window.innerHeight - 20,
      ohlcv: data,
      onchart: [
        {
          name: "EMA 9",
          type: "EMA",
          data: ema9,
          settings: { color: "white" },
        },
        {
          name: "EMA 20",
          type: "EMA",
          data: ema20,
          settings: { color: "yellow" },
        },
        {
          name: "EMA 50",
          type: "EMA",
          data: ema50,
          settings: { color: "purple" },
        },
        {
          name: "EMA 200",
          type: "EMA",
          data: ema200,
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
    };
  },
  methods: {
    async fetchData() {
      return await axios.request(options);
    },
    async insertData() {
      const res = await this.fetchData();

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
      console.log(this.apiData);
      this.ohlcv = this.apiData;
      this.$refs.tradingVue.resetChart();
    },
  },
  created() {
    this.insertData();
  },
  mounted() {
    this.$refs.tradingVue.resetChart();
  },
};

// csv.split("\n").forEach((l) => {
//   const d = l.split(";");

//   const open = parseFloat(d[1]);
//   const high = parseFloat(d[2]);
//   const low = parseFloat(d[3]);
//   const close = parseFloat(d[4]);

//   if (isNaN(open)) {
//     return;
//   }

//   const date = moment.tz(d[0], "YYYYMMDD hhmmss", "EST").toDate();

//   if (trades.length > 0) {
//     if (
//       date.getTime() < trades[0][0] - 3600000 * 5 ||
//       date.getTime() > trades[trades.length - 1][0] + 3600000 * 3
//     ) {
//       return;
//     }
//   }

//   data.push([date.getTime(), open, high, low, close]);
// });

// for (let i = 0; i < tempData.timestamp.length; i++) {
//   // this.apiData.push([
//   //   tempData.timestamp[i],
//   //   tempData.indicators.quote[0].open[i],
//   //   tempData.indicators.quote[0].high[i],
//   //   tempData.indicators.quote[0].low[i],
//   //   tempData.indicators.quote[0].close[i],
//   // ]);
//   console.log(this.apiData);
// }
// // console.log(data);
</script>
<style></style>
