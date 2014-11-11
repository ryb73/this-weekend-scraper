"use strict";

var q = require("q"),
    echonest = require("../matching/echonest"),
    stringMatcher = require("../matching/string-matcher"),
    artistUtils = require("./artist-utils"),
    log = require("../logging/log");

var happeningUtils = {};

happeningUtils.rawToDb = function rawToDb(happening) {
  return q.fcall(artistUtils.rawToDb, happening.headliner)
    .then(function (artist) {
      happening.headliner = artist;
      return happening;
    })

    .catch(function(err) {
      throw err.message; // allSettled doesn't work if I throw Error object. q bug?
    });
};

module.exports = happeningUtils;