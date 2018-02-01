"use strict";
const NodeHelper = require('node_helper');
const LvbFetcher = require('./LvbFetcher');

module.exports = NodeHelper.create({

  start: function () {
    this.departuresFetchers = []
  },

  createFetcher: function (config) {
    let fetcher;

    if (typeof this.departuresFetchers[config.stationId] === "undefined") {
      fetcher = new LvbFetcher(config);
      this.departuresFetchers[config.stationId] = fetcher;
      this.sendInit(fetcher);

      console.log("Transportation fetcher for station '" + fetcher.getStationName() + "' created. (Station ID: " + fetcher.getStationId() + ")");

    } else {
      fetcher = this.departuresFetchers[config.stationId];
      this.sendInit(fetcher);

      console.log("Using existing transportation fetcher for station '" + fetcher.getStationName() + "' (Station ID: " + fetcher.getStationId() + ")");
    }

    this.getDepartures(fetcher.getStationId());
  },

  sendInit: function (fetcher) {
    this.sendSocketNotification('FETCHER_INIT', {
      stationId: fetcher.getStationId(),
      stationName: fetcher.getStationName()
    });
  },

  getDepartures: function (stationId) {
    this.departuresFetchers[stationId].fetchDepartures().then((departuresData) => {
      this.pimpDeparturesArray(departuresData.departuresArray);
      this.sendSocketNotification('DEPARTURES', departuresData);
    }).catch((e) => {
      let error = {};
      console.log("Error while fetching departures (for Station ID " + stationId + "): " + e);
      // Add stationId to error for identification in the main instance
      error.stationId = stationId;
      error.message = e;
      this.sendSocketNotification('FETCH_ERROR', error);
    });
  },

  pimpDeparturesArray: function (departuresArray) {
    let currentProperties = {};

    departuresArray.forEach((current) => {
      currentProperties = this.getLineProperties(current);

      //if (!this.config.marqueeLongDirections) {
      //    current.direction = this.trimDirectionString(current.direction);
      //}
      current.color = currentProperties.color;
      current.cssClass = currentProperties.cssClass;
    });

    return departuresArray;
  },

  getLineProperties: function (product) {
    let out = {
        color: "",
        cssClass: this.getCssClass(product.nr)
    };

    return out;
  },

  getCssClass: function (lineNumber) {
    let cssClass = "sign " + lineNumber.replace(/\s/g, '').toLowerCase();

    return cssClass;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'GET_DEPARTURES') {
      this.getDepartures(payload);
    } else if (notification === 'CREATE_FETCHER') {
      this.createFetcher(payload);
    }
  }
});
