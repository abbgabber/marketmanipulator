var RSI = require("technicalindicators").RSI;
var axios = require("axios");
const jsonStocks = require("./stockJson.json");
const cronitor = require("cronitor")("b5c26d908e214204a9d02c4a1f217408");

exports.handler = async (event) => {
  const monitor = await cronitor.Monitor.put({
    type: "job",
    key: "stockChecker",
    schedule: "0 10 * * *",
  });

  console.log("Starting function");
  monitor.ping({ state: "run" });

  await getData(jsonStocks);

  const response = {
    statusCode: 200,
    body: JSON.stringify("Hello from Lambda!"),
  };

  await monitor.ping({ state: "complete" });
  return response;
};

async function getData(data) {
  for (let i = 0; i < jsonStocks.length - 1; i++) {
    console.log("i", i);

    await insertData(data[i].id);
  }
}

async function insertData(id) {
  let apiData = [];
  let rsi = [];
  apiData = [];
  let url =
    "https://discord.com/api/webhooks/961903870605398066/CMNlvPQK9-lkhDgxExk2b3TU2Br8FLYIPcgV_P-6So48DdBrf_qyXvvEFKdl18gANed-";

  const res = await fetchData(id);

  let data = res.data.chart.result[0];

  // console.log(data.indicators.quote[0].open[0]);
  for (let i = 0; i < data.timestamp.length; i++) {
    apiData.push([
      data.timestamp[i],
      data.indicators.quote[0].open[i],
      data.indicators.quote[0].high[i],
      data.indicators.quote[0].low[i],
      data.indicators.quote[0].close[i],
    ]);
  }

  const closeData = [];

  apiData.forEach((d) => closeData.push(d[4]));

  var inputRSI = {
    values: closeData,
    period: 14,
  };

  const rsiData = RSI.calculate(inputRSI);
  RSI.calculate(inputRSI);
  rsi = [];
  apiData.forEach((d, i) => {
    const emad = i > 14 ? rsiData[i - 14] : undefined;
    rsi.push([d[0], emad]);
  });

  // rsi.push([new Date().getTime(), 69]);
  // console.log(apiData);

  console.log(rsi[rsi.length - 1][1]);
  if (rsi[rsi.length - 1][1] === undefined) return;
  if (
    parseInt(rsi[rsi.length - 1][1]) <= 32 &&
    parseInt(rsi[rsi.length - 1][1]) >= 28
  ) {
    // console.log("buying");
    await axios
      .post(url, {
        content:
          "Check out " + id + " it has an RSI of " + rsi[rsi.length - 1][1],
      })
      .then(console.log("Buy signal sent"));
    return;
  }
  if (
    parseInt(rsi[rsi.length - 1][1]) <= 72 &&
    parseInt(rsi[rsi.length - 1][1]) >= 68
  ) {
    // console.log("selling");
    await axios
      .post(url, {
        content:
          "Check out " + id + " it has an RSI of " + rsi[rsi.length - 1][1],
      })
      .then(console.log("Sell signal sent"));
    return;
  }
}

async function fetchData(id) {
  return axios.request({
    method: "GET",
    url:
      "https://yfapi.net/v8/finance/chart/" +
      id +
      "?range=1y&region=US&interval=1d&lang=en",

    headers: { "X-API-KEY": "JWUPQkJyvq3xFoDcNP1DC9cQS5xjq3tH7In2Mgo9" },
  });
}
