"use strict";

class DomCreator {
  constructor(config, error, departuresArray) {
    this.config = config;
    this.error = error;
    this.departuresArray = departuresArray;
  }


  getInitializingDom(message) {
    let wrapper = this.getWrapper();
    wrapper.className = "small light dimmed";
    wrapper.innerHTML = message;

    return wrapper;
  }


  getErrorDom(message) {
    let wrapper = this.getWrapper();
    wrapper.appendChild(this.createHeadingElement());

    let errorContent = document.createElement("div");
    errorContent.innerHTML = message;
    errorContent.className = "small light dimmed";

    wrapper.appendChild(errorContent);

    return wrapper;
  }


  getDom(stationName, headings, noDeparturesMessage) {
    let wrapper = this.getWrapper();
    wrapper.appendChild(this.createHeadingElement(this.config.headerPrefix, stationName));

    // Creating the table which will display departures
    let table = document.createElement("table");
    table.className = "ptbTable small light";

    // Table header
    if (this.config.showTableHeaders) {
      table.appendChild(this.createTableHeaderElement(headings));
    }

    // Table body
    table.appendChild(this.createTableBody(this.departuresArray, noDeparturesMessage));
    wrapper.appendChild(table);

    return wrapper;
  }


  getWrapper() {
    let wrapper = document.createElement("div");
    wrapper.className = "ptbWrapper";

    return wrapper;
  }


  // Create the module header. Prepend headerPrefix if given.
  createHeadingElement(headerPrefix, stationName) {
    let headingElement = document.createElement("header");
    let heading = stationName;

    if (headerPrefix !== "") {
      heading = headerPrefix + " " + heading;
    }

    headingElement.innerHTML = heading;

    return headingElement;
  }


  // Create the table header for departures table.
  createTableHeaderElement(headings) {
    let tHead = document.createElement("thead");
    let headerRow = document.createElement("tr");
    headerRow.className = "bold dimmed";

    headerRow.appendChild(this.createHeaderTimeCell(headings.time));
    headerRow.appendChild(this.createHeaderDelayCell(headings.delay));
    headerRow.appendChild(this.createHeaderLineCell(headings.line));
    headerRow.appendChild(this.createHeaderDirectionCell(headings.direction));

    tHead.appendChild(headerRow);

    return tHead;
  }


  // Create header cell for time column in departures table.
  createHeaderTimeCell(title) {
    // Cell for departure time
    let timeCell = document.createElement("td");
    this.populateHeaderCell(timeCell, "fa fa-clock-o", title);

    return timeCell;
  }


  // Create header cell for delay column in departures table.
  createHeaderDelayCell(title) {
    // Cell for timeToStation time
    let delayCell = document.createElement("td");
    delayCell.innerHTML = title;

    return delayCell;
  }


  // Create header cell for line column in departures table.
  createHeaderLineCell(title) {
    let lineCell = document.createElement("td");
    this.populateHeaderCell(lineCell, "fa fa-tag", title);

    return lineCell;
  }


  // Create header cell for direction column in departures table.
  createHeaderDirectionCell(title) {
    let directionCell = document.createElement("td");
    this.populateHeaderCell(directionCell, "fa fa-exchange", title);
    directionCell.className = "textRight";

    return directionCell;
  }


  // Populate the given header cell with the given value respecting config.showTableHeaderAsSymbols.
  populateHeaderCell(cell, iconClass, text) {
    if (this.config.showTableHeadersAsSymbols) {
      cell.className = "centeredTd";
      let timeIcon = document.createElement("span");
      timeIcon.className = iconClass;
      cell.appendChild(timeIcon);

    } else {
      cell.innerHTML = text;
    }
  }


  // Populate the given table body with departure data.
  /**
   * @param departures
   * @param noDeparturesMessage
   */
  createTableBody(departures, noDeparturesMessage) {
    let tBody = document.createElement("tbody");

    // No departures available.
    if (departures.length === 0) {
      let row = this.getNoDeparturesRow(noDeparturesMessage);
      tBody.appendChild(row);

      return tBody;
    }

    // handle timeToStation === 0
    if (this.config.timeToStation === 0) {
      departures.forEach((currentDeparture, i) => {
        if (i < this.config.maxReachableDepartures) {
          let row = this.createRow(currentDeparture);
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

    return tBody;
  }


  fadeRow(row, offset, index) {
    if (this.config.fadeReachableDepartures) {
      let startingPoint = this.config.maxReachableDepartures * this.config.fadePointForReachableDepartures;
      let steps = this.config.maxReachableDepartures - startingPoint;

      if (index >= offset + startingPoint) {
        let currentStep = (index - offset) - startingPoint;
        row.style.opacity = 1 - (1 / steps * currentStep);
      }
    }
  }


  buildDepartureRows(tBody, reachableDeparturePos) {
    this.departuresArray.forEach((currentDeparture, i) => {
      if (i >= reachableDeparturePos - this.config.maxUnreachableDepartures
        && i < reachableDeparturePos + this.config.maxReachableDepartures) {

        // insert ruler to separate reachable departures
        if (i === reachableDeparturePos && reachableDeparturePos !== 0 && this.config.maxUnreachableDepartures !== 0) {
          let rulerRow = document.createElement("tr");

          let rulerCell = document.createElement("td");
          rulerCell.colSpan = 4;
          rulerCell.className = "rulerCell";
          rulerRow.appendChild(rulerCell);

          tBody.appendChild(rulerRow);
        }

        // create standard row
        let row = this.createRow(currentDeparture);

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
  }


  getFirstReachableDeparturePosition() {
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
  }


  getNoDeparturesRow(message) {
    let row = document.createElement("tr");
    let cell = document.createElement("td");

    cell.colSpan = 4;
    cell.innerHTML = message;
    row.appendChild(cell);

    return row;
  }


  // Create a row for the departures table with the given departure data.
  createRow(departure) {
    let currentWhen = moment(departure.when);
    let delay = departure.delay;
    let lineName = departure.name;
    let direction = departure.direction;

    let row = document.createElement("tr");

    row.appendChild(this.createTimeCell(currentWhen));
    row.appendChild(this.createDelayCell(delay));
    row.appendChild(this.createLineCell(lineName));
    row.appendChild(this.createDirectionCell(direction));

    return row;
  }


  // Create a cell for the departures table for departure time column.
  createTimeCell(departureTime) {
    let timeCell = document.createElement("td");
    timeCell.className = "centeredTd timeCell";
    timeCell.innerHTML = departureTime.format("HH:mm");

    return timeCell;
  }


  // Create a cell for the departures table for the delay column.
  createDelayCell(delay) {
    let delayCell = document.createElement("td");
    delayCell.className = "delayTimeCell";

    if (delay > 0) {
      delayCell.innerHTML = "+" + delay + " ";
      if (this.config.useColorForRealtimeInfo) {
        delayCell.style.color = "red";
      }
    } else if (delay < 0) {
      delayCell.innerHTML = "-" + delay + " ";
      if (this.config.useColorForRealtimeInfo) {
        delayCell.style.color = "green";
      }
    } else if (delay === 0) {
      delayCell.innerHTML = "";
    }

    return delayCell;
  };


  // Create a cell for the departures table for the line column.
  createLineCell(departure) {
    let lineCell = document.createElement("td");
    lineCell.className = "centeredTd noPadding lineCell";
    lineCell.appendChild(this.getLineSymbol(departure));

    return lineCell;
  }


  // Create a cell for the departures table for the direction column.
  createDirectionCell(direction) {
    let directionCell = document.createElement("td");
    directionCell.className = "directionCell";

    if (this.config.marqueeLongDirections && direction.length >= 26) {
      directionCell.className = "directionCell marquee";
      let directionSpan = document.createElement("span");
      directionSpan.innerHTML = direction;
      directionCell.appendChild(directionSpan);

    } else {
      directionCell.innerHTML = this.trimDirectionString(direction);
    }

    return directionCell;
  }


  // Create a symbol representing the line.
  getLineSymbol(lineName) {
    let symbol = document.createElement('div');

    symbol.innerHTML = lineName;
    symbol.className = this.getCssClassForLine(lineName);

    return symbol;
  }


  getCssClassForLine(lineName) {
    if (this.config.showColoredLineSymbols) {
      return "sign " + lineName.replace(/\s/g, '').toLowerCase() + " xsmall";
    } else {
      return "sign bwLineSign xsmall";
    }
  }


  trimDirectionString(string) {
    if (string.length < 26) {
      return string;
    }

    let result = string.replace("Leipzig", "L");

    if (result.length < 26) {
      return result;
    }

    if (result.indexOf(',') > -1) {
      result = result.split(',')[1];
    }

    let viaIndex = result.search(/( via )/g);
    if (viaIndex > -1) {
      result = result.split(/( via )/g)[0];
    }

    return result;
  }
}
