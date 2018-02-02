"use strict";
const lvbClient = require('lvb');

let LvbFetcher = function (config) {
  this.config = config;
};

LvbFetcher.prototype.getStationId = function () {
  return this.config.stationId;
};

LvbFetcher.prototype.getStationName = function () {
  return this.config.stationName;
};

LvbFetcher.prototype.fetchDepartures = function () {
  let when = this.getDepartureTime();
  let origin = this.getOrigin();

  return lvbClient.departures(origin, when)
    .then((response) => {
      return this.processData(response);
    }).catch((e) => {
        throw e;
    });
};

// Helper Functions

LvbFetcher.prototype.getDepartureTime = function () {
  // when value for a request is calculated to be 5 minutes before timeToStation time
  // so we can also show the non-reachable departures in the module
  let when;

  if (this.config.timeToStation > 0) {
    when = new Date();
    when.setTime((Date.now() + this.config.timeToStation * 60000) - (5 * 60000));
  } else {
    when = Date.now();
  }

  return when;
};

LvbFetcher.prototype.getOrigin = function () {
  let origin = this.config.stationId;

  if (origin === "99999") {
    origin = this.config.stationName;
  }

  return origin;
};

LvbFetcher.prototype.processData = function (data) {
  let departuresData = {
    stationId: this.config.stationId,
    departuresArray: []
  };

  data.forEach((row) => {
    let departures = this.createDeparturesForLine(row);

    departures.forEach((current) => {
      departuresData.departuresArray.push(current);
    });
  });

  departuresData.departuresArray.sort(compareTimes);

  return departuresData;
};


LvbFetcher.prototype.createDeparturesForLine = function(lineInDirection) {
  let departures = [];

  let name = lineInDirection.line.name.replace(/\s\s+/g, ' ');
  let nr = lineInDirection.line.name.replace(/\s\s+/g, ' ');
  let type = lineInDirection.line.class;
  let direction = lineInDirection.line.direction;

  lineInDirection.timetable.forEach((departureTime) => {
    if (this.isValidDeparture(type, name, direction)) {
      let when = getWhen(departureTime);
      let delay = getDelay(departureTime);

      let current = {
        when: when,
        delay: delay,
        name: name,
        nr: nr,
        type: type,
        direction: direction,
      };

      // printDeparture(current);
      departures.push(current);
    }
  });

  return departures;
};

LvbFetcher.prototype.isValidDeparture = function (type, name, direction) {
  let isExcludedType = this.config.excludedTransportationTypes.includes(type);
  let isIgnoredLine = this.config.ignoredLines.includes(name);

  let isInDirection = this.config.directions.length === 0;

  this.config.directions.forEach((allowedDirection) => {
    isInDirection = isInDirection || direction.includes(allowedDirection);
  });

  return !isExcludedType && !isIgnoredLine && isInDirection;
};

function getWhen(departureTime) {
  return departureTime.departure;
}


function getDelay(departureTime) {
  let delay = departureTime.departureDelay;

  if (!delay) {
    delay = 0
  } else {
    delay = delay / 1000 / 60;
  }

  return delay;
}


function compareTimes(a, b) {
  let timeA = a.when.getTime() + a.delay;
  let timeB = b.when.getTime() + b.delay;

  if (timeA < timeB) {
    return -1;
  }
  if (timeA > timeB) {
    return 1
  }

  return 0
}


// helper function to print departure for debugging
function printDeparture(departure) {
  console.log("departure: ");

  let timeToStation = departure.timeToStation;
  let time = departure.when.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

  console.log("(" + departure.type + ") " + departure.name + " (" + departure.nr + "): " + departure.direction + " – departure: " + time + " +" + timeToStation);
}

module.exports = LvbFetcher;
