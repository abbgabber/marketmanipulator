<template>
  <div>
    <div class="loading" v-if="loading">
      <v-progress-circular
        indeterminate
        color="blue"
        size="72"
      ></v-progress-circular>
    </div>

    <div class="options">
      <!-- <v-select
        class="options--timezone"
        v-model="tz"
        :items="timezoneData"
        item-text="label"
        label="Timezone"
        hint="Select your timezone"
        return-object
        outlined
      ></v-select> -->
      <v-select
        v-model="stocks"
        :items="items"
        item-text="name"
        item-value="id"
        label="Stocks"
        hint="Select your stock"
        return-object
        outlined
        left
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
      <h4>7-day price: {{ weekChange[4] }}</h4>
      <h4>
        Change 7-day:
        {{ (apiData[apiData.length - 1][4] / weekChange[4]) * 100 }}%
      </h4>
      <h4>Year Price: {{ yearChange[4] }}</h4>
      <h4>
        Change last year:
        {{ (apiData[apiData.length - 1][4] / yearChange[4]) * 100 }}%
      </h4>
    </div>
  </div>
</template>
<script>
import { TradingVue } from "trading-vue-js";
import { EMA, RSI } from "technicalindicators";

var axios = require("axios");
const timezoneData = require("../assets/tz.json");
const jsonStocks = require("../assets/stockJson.json");

let data = [];

export default {
  name: "app",
  components: { TradingVue },

  data() {
    return {
      items: jsonStocks,
      tz: timezoneData[26],
      loading: false,
      stocks: "",
      timezoneData: timezoneData,
      apiData: [],
      weekChange: "",
      yearChange: "",
      prediction: false,
      titleText: "Market Manipulator2k",
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,

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
      ],
      offchart: [{ name: "RSI", type: "RSI", data: [] }],
    };
  },
  methods: {
    getDimensions() {
      this.width = document.documentElement.clientWidth;
      this.height = document.documentElement.clientHeight;
    },
    async fetchData(id) {
      return await axios.request({
        method: "GET",
        url:
          "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" +
          id +
          "&interval=5min&apikey=FUOIZZHV806NY77H&outputsize=full",
      });
    },
    async insertData(id) {
      this.apiData = [];
      const res = await this.fetchData(id);
      console.log(res);
      for (const [timestamp, value] of Object.entries(
        res.data["Time Series (Daily)"]
      )) {
        let date = new Date(timestamp);
        this.apiData.push([
          date.getTime() + (parseInt(this.tz.value) + 4) * 60 * 60 * 1000,
          parseFloat(value["1. open"]),
          parseFloat(value["2. high"]),
          parseFloat(value["3. low"]),
          parseFloat(value["4. close"]),
        ]);
      }

      this.apiData.reverse();
      this.ohlcv = this.apiData;

      const closeData = [];
      this.apiData.forEach((d) => closeData.push(d[4]));

      this.onchart[0].data = [];
      const ema9Data = new EMA.calculate({ period: 9, values: closeData });
      this.apiData.forEach((d, i) => {
        const emad = i > 9 ? ema9Data[i - 9] : undefined;
        this.onchart[0].data.push([d[0], emad]);
      });

      this.onchart[1].data = [];
      const ema20Data = new EMA.calculate({ period: 20, values: closeData });
      this.apiData.forEach((d, i) => {
        const emad = i > 20 ? ema20Data[i - 20] : undefined;
        this.onchart[1].data.push([d[0], emad]);
      });

      this.onchart[2].data = [];
      const ema50Data = new EMA.calculate({ period: 50, values: closeData });
      this.apiData.forEach((d, i) => {
        const emad = i > 50 ? ema50Data[i - 50] : undefined;
        this.onchart[2].data.push([d[0], emad]);
      });

      this.onchart[3].data = [];
      const ema200Data = new EMA.calculate({ period: 200, values: closeData });
      this.apiData.forEach((d, i) => {
        const emad = i > 200 ? ema200Data[i - 200] : undefined;
        this.onchart[3].data.push([d[0], emad]);
      });

      var inputRSI = {
        values: closeData,
        period: 14,
      };
      this.offchart[0].data = [];
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
      await this.getStats();
      this.loading = false;
    },
    async getStats() {
      this.weekChange = this.apiData[this.apiData.length - 4];
      this.yearChange = this.apiData[this.apiData.length - (5 * 52 - 7)];
    },
  },
  // created() {},
  mounted() {
    this.tz = JSON.parse(localStorage.getItem("timezone"));
    window.addEventListener("resize", this.getDimensions, { passive: true });
  },
  unmounted() {
    window.removeEventListener("resize", this.getDimensions, { passive: true });
  },
  watch: {
    stocks() {
      this.updateData(this.stocks.id);
    },
    tz() {
      localStorage.setItem("timezone", JSON.stringify(this.tz));
      if (this.apiData.length > 0) {
        this.updateData(this.stocks.id);
      }
    },
  },
};
</script>
<style>
.options {
  position: absolute;
  z-index: 10;
  left: 82vw;
  top: 2vh;
  max-width: 11rem;
}

.loading {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 11;
}
</style>
