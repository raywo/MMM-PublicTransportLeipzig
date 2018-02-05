// Enter your station name here:
const stationName = "Goerdelerring";

// Don’t edit anything beyond this point.
const stations = require('lvb').stations;
stations(stationName).then((response) => {
  console.log("stationID for: " + stationName);
  console.log(response);
}).catch((e) => {
  console.log(e);
});
