"use strict";

var q = require("q"),
    mongojs = require("mongojs"),
    frequency = require("./lib/scraping/frequency"),
    echonest = require("./lib/matching/echonest"),
    stringMatcher = require("./lib/matching/string-matcher"),
    happeningUtils = require("./lib/data/happening-utils"),
    artistUtils = require("./lib/data/artist-utils"),
    log = require("./lib/logging/log"),
    config = require("./config/config");

var db = initializeDatabase();
artistUtils.setCollection(db[config.artistsCollection]);

frequency()
  .then(function(rawHappenings) {
    var fcalls = rawHappenings.map(function(rawHappening) {
      return q.fcall(happeningUtils.rawToDb, rawHappening);
    });

    return q.allSettled(fcalls);
  })
  .then(function(happenings) {
    log.info({happenings:happenings})
  })
  .catch(function(err) {
    log.error(err, "error getting happenings from frequency: %s", err.message);
  })
  .fin(function(){
    db.close();
  })
  .done();

function initializeDatabase() {
  return mongojs(config.db, [config.artistsCollection]);
}