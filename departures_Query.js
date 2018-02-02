// Enter your station name here:
const departureStation = "Klingerweg";

// Don’t edit anything beyond this point.
console.log("departures for " + departureStation + ":");
const departures = require('lvb').departures;
departures(departureStation, new Date()).then((response) => {
  console.log(response);
}).catch((e) => {
  console.log(e);
});
