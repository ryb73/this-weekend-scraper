"use strict";

var frequency = require("./lib/scraping/frequency"),
    log = require("./lib/logging/log");

frequency(function (data) {
  log.info({data:data});
});