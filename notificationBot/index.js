var RSI = require("technicalindicators").RSI;
var axios = require("axios");

// exports.handler = async (event) => {
const jsonStocks = require("./stockJson.json");

console.log("Starting function");

for (let i = 0; i < 1; i++) {
  await insertData(jsonStocks[i].id);
}

//   const response = {
//     statusCode: 200,
//     body: JSON.stringify("Hello from Lambda!"),
//   };
//   return response;
// };

function getRandomInt(min, max) {
  min = Math.ceil(28);
  max = Math.floor(32);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function insertData(id) {
  let apiData = [];
  let rsi = [];
  let url =
    "https://discord.com/api/webhooks/959085685179047996/lIhcWTDWScP9gLoQvWjok9uJn-rlC31IHrmEqMGWy1D-Y4X8qAUbkSCG5OCnaqVHDUBv";

  apiData = [];
  const res = await fetchData(id);

  for (const [timestamp, value] of Object.entries(
    res.data["Time Series (Daily)"]
  )) {
    let date = new Date(timestamp);
    apiData.push([
      date.getTime(),
      parseFloat(value["1. open"]),
      parseFloat(value["2. high"]),
      parseFloat(value["3. low"]),
      parseFloat(value["4. close"]),
    ]);
  }

  apiData.reverse();

  const closeData = [];

  apiData.forEach((d) => closeData.push(d[4]));

  var inputRSI = {
    values: closeData,
    period: 14,
  };
  console.log("hello from lambda");
  const rsiData = RSI.calculate(inputRSI);
  RSI.calculate(inputRSI);
  rsi = [];
  apiData.forEach((d, i) => {
    const emad = i > 14 ? rsiData[i - 14] : undefined;
    rsi.push([d[0], emad]);
  });

  // rsi.push(["Hello", getRandomInt(28, 32)]);
  // console.log("hello from rsi", rsi[rsi.length - 1]);

  for (let i = rsi.length - 1; i > rsi.length - 3; i--) {
    if ((rsi[i][1] = undefined)) return;
    if (rsi[i][1] <= 32 && rsi[i][1] >= 28) {
      console.log(
        await axios
          .post(url, {
            content:
              "Check out " +
              id +
              " it has an RSI of " +
              rsi[i][1] +
              "it is currently at " +
              apiData[i][4] +
              ", this is a sell signal.",
          })
          .then((res) => console.log(res))
      );
      return;
    }
    if (rsi[i][1] <= 72 && rsi[i][1] >= 68) {
      await axios
        .post(url, {
          content:
            "Check out " +
            id +
            " it has an RSI of " +
            rsi[i][1] +
            " it is currently at " +
            apiData[i][4] +
            ", this is a sell signal.",
        })
        .then((res) => console.log(res));
    }
  }
}
async function fetchData(id) {
  return axios.request({
    method: "GET",
    url:
      "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" +
      id +
      "&interval=5min&apikey=X5YMPO47GDFE49Y5&outputsize=compat",
  });
}
