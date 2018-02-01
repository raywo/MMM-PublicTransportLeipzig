"use strict";

Module.register("MMM-PublicTransportLeipzig", {

  // default values
  defaults: {
    name: "MMM-PublicTransportLeipzig",
    hidden: false,
    headerPrefix: "",
    stationName: "Wilhelm-Leuschner-Platz",
    stationId: "99999",
    directions: [],                     // Which directions (final destinations) should be included? (You need to list all possible final destinations to see all possible departures. For instance for Str 1 you need to list "Schönefeld" and "Mockau" to see Str 1 and Str 1E.)
    ignoredLines: [],                   // Which lines should be ignored? (comma-separated list of line names)
    excludedTransportationTypes: [],    // Which transportation types should not be shown on the mirror? (comma-separated list of types) possible values: StN for tram, BuN for bus, s for suburban
    marqueeLongDirections: true,        // Use Marquee effect for long station names?
    timeToStation: 10,                  // How long do you need to walk to the next Station?
    interval: 120,                      // How often should the table be updated in s?
    showColoredLineSymbols: true,       // Want colored line symbols?
    useColorForRealtimeInfo: true,      // Want colored real time information (timeToStation, early)?
    showTableHeaders: true,             // Show table headers?
    showTableHeadersAsSymbols: true,    // Table Headers as symbols or written?
    maxUnreachableDepartures: 3,        // How many unreachable departures should be shown?
    maxReachableDepartures: 7,          // How many reachable departures should be shown?
    fadeUnreachableDepartures: true,
    fadeReachableDepartures: true,
    fadePointForReachableDepartures: 0.25
  },


  start: function () {
    Log.info("Starting module: " + this.name);

    this.departuresArray = [];
    this.stationName = "";
    this.loaded = false;
    this.error = {};

    this.sanitizeConfig();

    this.sendSocketNotification('CREATE_FETCHER', this.config);

    setInterval(() => {
      // noinspection Annotator
      this.sendSocketNotification('GET_DEPARTURES', this.config.stationId);
    }, this.config.interval * 1000)
  },


  sanitizeConfig: function () {
    if (this.config.timeToStation < 0) {
      this.config.timeToStation = 0;
    }

    if (typeof this.config.ignoredLines === 'undefined') {
      this.config.ignoredLines = [];
    }

    // set minimum interval to 30 seconds
    if (this.config.interval < 30) {
      this.config.interval = 30;
    }

    if (this.config.fadePointForReachableDepartures < 0) {
      this.config.fadePointForReachableDepartures = 0;
    }
  },


  getDom: function () {
    let wrapper = document.createElement("div");
    wrapper.className = "ptbWrapper";

    // Handle loading sequence at init time
    if (this.departuresArray.length === 0 && !this.loaded) {
      wrapper.innerHTML = (this.loaded) ? this.translate("EMPTY") : this.translate("LOADING");
      wrapper.className = "small light dimmed";

      return wrapper;
    }

    wrapper.appendChild(this.createHeadingElement());

    // Handle departure fetcher error and show it on the screen
    if (Object.keys(this.error).length > 0) {
      wrapper.appendChild(this.createErrorContent(this.error.message));

      return wrapper;
    }

    // Creating the table which will display departures
    let table = document.createElement("table");
    table.className = "ptbTable small light";

    // Table header
    if (this.config.showTableHeaders) {
      table.appendChild(this.createTableHeaderElement());
    }

    // Table body
    let tBody = document.createElement("tbody");

    this.populateTableBody(tBody);
    table.appendChild(tBody);
    wrapper.appendChild(table);

    return wrapper;
  },


  // Create the module header. Prepend headerPrefix if given.
  createHeadingElement: function () {
    let headingElement = document.createElement("header");
    let heading = this.stationName;

    if (this.config.headerPrefix !== "") {
      heading = this.config.headerPrefix + " " + heading;
    }

    headingElement.innerHTML = heading;

    return headingElement;
  },


  // Create a div with the given message.
  createErrorContent: function (message) {
    let errorContent = document.createElement("div");
    // TODO: translate!
    errorContent.innerHTML = "Error while fetching departures: " + JSON.stringify(message) + "<br>";
    errorContent.innerHTML += "This could mean that LVB data is currently not available.";
    errorContent.className = "small light dimmed";
    return errorContent;
  },


  // Create the table header for departures table.
  createTableHeaderElement: function () {
    let tHead = document.createElement("thead");
    let headerRow = document.createElement("tr");

    headerRow.appendChild(this.createHeaderTimeCell());
    headerRow.appendChild(this.createHeaderDelayCell());
    headerRow.appendChild(this.createHeaderLineCell());
    headerRow.appendChild(this.createHeaderDirectionCell());

    headerRow.className = "bold dimmed";
    tHead.appendChild(headerRow);

    return tHead;
  },


  // Create header cell for time column in departures table.
  createHeaderTimeCell: function () {
    // Cell for departure time
    let timeCell = document.createElement("td");
    // TODO: translate
    this.populateHeaderCell(timeCell, "fa fa-clock-o", "Abfahrt");

    return timeCell;
  },


  // Create header cell for delay column in departures table.
  createHeaderDelayCell: function () {
    // Cell for timeToStation time
    let delayCell = document.createElement("td");
    delayCell.innerHTML = "&nbsp;";

    return delayCell;
  },


  // Create header cell for line column in departures table.
  createHeaderLineCell: function () {
    // Cell for line symbol
    let lineCell = document.createElement("td");
    // TODO: translate
    this.populateHeaderCell(lineCell, "fa fa-tag", "Linie");

    return lineCell;
  },


  // Create header cell for direction column in departures table.
  createHeaderDirectionCell: function () {
    // Cell for direction
    let directionCell = document.createElement("td");
    // TODO: translate
    this.populateHeaderCell(directionCell, "fa fa-exchange", "Nach");

    return directionCell;
  },


  // Populate the given header cell with the given value respecting config.showTableHeaderAsSymbols.
  populateHeaderCell: function (cell, iconClass, text) {
    if (this.config.showTableHeadersAsSymbols) {
      cell.className = "centeredTd";
      let timeIcon = document.createElement("span");
      timeIcon.className = iconClass;
      cell.appendChild(timeIcon);
    } else {
      cell.innerHTML = text;
    }
  },


  // Populate the given table body with departure data.
  populateTableBody: function (tBody) {
    // No departures available.
    if (this.departuresArray.length === 0) {
      // TODO: add translation
      let row = this.getNoDeparturesRow("There are currently no departures.");
      tBody.appendChild(row);

      return;
    }

    // handle timeToStation === 0
    if (this.config.timeToStation === 0) {
      this.departuresArray.forEach((currentDeparture, i) => {
        if (i < this.config.maxReachableDepartures) {
          let row = this.getRow(currentDeparture);
          tBody.appendChild(row);
          this.fadeRow(row, 0, i);
        }
      });

    // handle timeToStation > 0
    } else {
      this.getFirstReachableDeparturePosition().then(
        (reachableDeparturePos) => {
          this.buildDepartureRows(tBody, reachableDeparturePos);
        },
        (message) => {
          let row = this.getNoDeparturesRow(message);
          tBody.appendChild(row);
        });
    }
  },


  fadeRow: function (row, offset, index) {
    if (this.config.fadeReachableDepartures) {
      let startingPoint = this.config.maxReachableDepartures * this.config.fadePointForReachableDepartures;
      let steps = this.config.maxReachableDepartures - startingPoint;

      if (index >= offset + startingPoint) {
        let currentStep = (index - offset) - startingPoint;
        row.style.opacity = 1 - (1 / steps * currentStep);
      }
    }
  },


  buildDepartureRows: function (tBody, reachableDeparturePos) {
    this.departuresArray.forEach((currentDeparture, i) => {
      if (i >= reachableDeparturePos - this.config.maxUnreachableDepartures
        && i < reachableDeparturePos + this.config.maxReachableDepartures) {

        // insert ruler to separate reachable departures
        if (i === reachableDeparturePos && reachableDeparturePos !== 0 && this.config.maxUnreachableDepartures !== 0) {
          let ruleRow = document.createElement("tr");

          let ruleCell = document.createElement("td");
          ruleCell.colSpan = 4;
          ruleCell.className = "ruleCell";
          ruleRow.appendChild(ruleCell);

          tBody.appendChild(ruleRow);
        }

        // create standard row
        let row = this.getRow(currentDeparture);

        // fading for entries before "timeToStation ruler"
        if (this.config.fadeUnreachableDepartures && this.config.timeToStation > 0) {
          let steps = this.config.maxUnreachableDepartures;

          if (i >= reachableDeparturePos - steps && i < reachableDeparturePos) {
            let currentStep = reachableDeparturePos - i;
            row.style.opacity = 1 - ((1 / steps * currentStep) - 0.2);
          }
        }

        // fading for entries after "timeToStation ruler"
        this.fadeRow(row, reachableDeparturePos, i);

        tBody.appendChild(row);
      }
    });
  },


  getNoDeparturesRow: function (message) {
    let row = document.createElement("tr");
    let cell = document.createElement("td");

    cell.colSpan = 4;
    cell.innerHTML = message;
    row.appendChild(cell);

    return row;
  },


  getFirstReachableDeparturePosition: function () {
    let now = moment();
    let nowWithTimeToStation = now.add(this.config.timeToStation, 'minutes');

    return new Promise((resolve, reject) => {
      this.departuresArray.forEach((current, i, depArray) => {

        let currentWhen = moment(current.when);

        // all but last entries
        if (depArray.length > 1 && i < depArray.length - 1) {
          let nextWhen = moment(depArray[i + 1].when);

          if ((currentWhen.isBefore(nowWithTimeToStation) && nextWhen.isSameOrAfter(nowWithTimeToStation))
            || (i === 0 && nextWhen.isSameOrAfter(nowWithTimeToStation))) {

            resolve(i);
          }

          // last entry but unreachable
        } else if (i === depArray.length - 1 && currentWhen.isBefore(nowWithTimeToStation)) {
          reject("No reachable departures found.");

        } else {
          reject("No reachable departures found.");
        }
      });
    });
  },


  getRow: function (departure) {
    let currentWhen = moment(departure.when);

    let row = document.createElement("tr");

    let timeCell = document.createElement("td");
    timeCell.className = "centeredTd timeCell";
    timeCell.innerHTML = currentWhen.format("HH:mm");
    row.appendChild(timeCell);

    let delayCell = document.createElement("td");
    delayCell.className = "delayTimeCell";

    let delay = departure.timeToStation;

    if (delay > 0) {
      delayCell.innerHTML = "+" + delay + " ";
      if (this.config.useColorForRealtimeInfo) {
        delayCell.style.color = "red";
      }
    } else if (delay < 0) {
      delayCell.innerHTML = delay + " ";
      if (this.config.useColorForRealtimeInfo) {
        delayCell.style.color = "green";
      }
    } else if (delay === 0) {
      delayCell.innerHTML = "";
    }

    row.appendChild(delayCell);

    let lineCell = document.createElement("td");
    let lineSymbol = this.getLineSymbol(departure);
    lineCell.className = "centeredTd noPadding lineCell";

    lineCell.appendChild(lineSymbol);
    row.appendChild(lineCell);

    let directionCell = document.createElement("td");
    directionCell.className = "directionCell";

    if (this.config.marqueeLongDirections && departure.direction.length >= 26) {
      directionCell.className = "directionCell marquee";
      let directionSpan = document.createElement("span");
      directionSpan.innerHTML = departure.direction;
      directionCell.appendChild(directionSpan);
    } else {
      directionCell.innerHTML = this.trimDirectionString(departure.direction);
    }

    row.appendChild(directionCell);

    return row;
  },


  trimDirectionString: function (string) {
    let dirString = string;

    if (dirString.indexOf(',') > -1) {
      dirString = dirString.split(',')[0]
    }

    let viaIndex = dirString.search(/( via )/g);
    if (viaIndex > -1) {
      dirString = dirString.split(/( via )/g)[0]
    }

    return dirString
  },

  getLineSymbol: function (product) {
    // TODO: color according to line color
    let symbol = document.createElement('div');

    if (product.type === 'express') {
      if (product.name === 'LOCOMORE')
        symbol.innerHTML = 'LOC';
      else
        symbol.innerHTML = 'ICE';
    } else {
      symbol.innerHTML = product.name;
    }

    symbol.className = product.cssClass + " xsmall";

    if (this.config.showColoredLineSymbols) {
      symbol.style.backgroundColor = product.color;
    } else {
      symbol.style.backgroundColor = "#333333";
    }

    return symbol;
  },

  getStyles: function () {
    return [
      'style.css',
      'font-awesome.css'
    ];
  },

  getScripts: function () {
    return [
      "moment.js"
    ];
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'FETCHER_INIT') {
      if (payload.stationId === this.config.stationId) {
        this.stationName = payload.stationName;
        this.loaded = true;
      }
    }

    if (notification === 'DEPARTURES') {
      this.config.loaded = true;

      if (payload.stationId === this.config.stationId) {
        // Empty error object
        this.error = {};
        // Proceed with normal operation
        this.departuresArray = payload.departuresArray;
        this.updateDom(3000);
      }
    }

    if (notification === 'FETCH_ERROR') {
      this.config.loaded = true;
      if (payload.stationId === this.config.stationId) {
        // Empty error object
        this.error = payload;
        this.updateDom(3000);
      }
    }
  }
});
