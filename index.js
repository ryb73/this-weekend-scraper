"use strict";

var q = require("q"),
    frequency = require("./lib/scraping/frequency"),
    echonest = require("./lib/matching/echonest"),
    stringMatcher = require("./lib/matching/string-matcher"),
    happeningUtils = require("./lib/data/happening-utils"),
    log = require("./lib/logging/log");

frequency()
  .then(function(rawHappenings) {
    var fcalls = rawHappenings.map(function(rawHappening) {
      return q.fcall(happeningUtils.rawToDb, rawHappening);
    });

    q.allSettled(fcalls)
      .then(function(happenings) {
        log.info({happenings:happenings})
      })
      .catch(function(err) {
        log.error(err, "error getting happenings: %s", err.message);
      })
      .done();
  })
  .catch(function(err) {
    log.error(err, "error getting happenings from frequency: %s", err.message);
  })
  .done();