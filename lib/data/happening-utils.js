"use strict";

var q           = require("q"),
    artistUtils = require("./artist-utils"),
    log         = console;

var happeningUtils = {};

var collection;

function setCollection(happeningCollection) {
  collection = happeningCollection;

  collection.ensureIndex({
    "showtime": 1
  }, checkError);
}
happeningUtils.setCollection = setCollection;

function checkError(err) {
  if(err)
    log.error(err);
}

function query(params) {
  var deferred = q.defer();

  var critera = {};

  if("daysForward" in params) {
    // this only supports server local time atm
    var daysForward = parseInt(params.daysForward, 10);
    if(isNaN(daysForward) || daysForward < 0) {
      deferred.reject(new Error("Invalid value for daysForward"));
      return deferred.promise;
    }

    var beginRange = new Date();
    beginRange.setHours(0, 0, 0, 0);

    var endRange = new Date(beginRange.getFullYear(), beginRange.getMonth(), beginRange.getDate() + daysForward + 1);

    critera.showtime = {
      $gte: beginRange,
      $lt: endRange
    };
  }

  collection.find(critera).sort({ showtime: 1}, function(err, result) {
    if(err) {
      deferred.reject(err);
      return;
    }

    deferred.resolve(result);
  });

  return deferred.promise
    .invoke("map", resolveArtists)
    .then(q.all);
}
happeningUtils.query = query;

function resolveArtists(happening) {
  var promResolveHeadliners = q.all(happening.headliners.map(artistUtils.resolveArtist));
  var promResolveOpeners = q.all(happening.openers.map(artistUtils.resolveArtist));
  return q.all([ promResolveHeadliners, promResolveOpeners ])
    .spread(function(headliners, openers) {
      var res = happening;
      res.headliners = headliners;
      res.openers = openers;
      res.venue = {
        name: "The Frequency" // because that's the only option for now
      };
      return res;
    });
}

module.exports = happeningUtils;