"use strict";

var q       = require("q"),
    echonest = require("../matching/echonest"),
    stringMatcher = require("../matching/string-matcher"),
    log = require("../logging/log");;

var artistUtils = {};

var collection;

artistUtils.setCollection = function setCollection(artistCollection) {
  collection = artistCollection;
}

artistUtils.rawToDb = function rawToDb(rawArtist) {
  return getMatchedArtist(rawArtist)
    .then(postToDb)
};

function postToDb(artist) {
  var deferred = q.defer();

  if(artist._id) {
    var criteria = { _id: artist._id };
    collection.update(criteria, artist, { upsert: true });
    deferred.reject("welp");
  } else {
    // var criteria = {};
    // for(var )
    collection.insert(artist, function(err) {
      if(err) {
        deferred.reject(err);
      } else {
        deferred.resolve(artist._id);
      }
    });
  }

  return deferred.promise;
}

function getMatchedArtist(rawArtist) {
  var deferred = q.defer();

  echonest.findMatchingArtists(rawArtist, function(err, artists) {
    if(err) {
      deferred.reject(err);
      return;
    }

    var artistNames = artists.map(getArtistName);
    var bestMatch = stringMatcher.findBestMatch(rawArtist, artistNames);
    if(bestMatch >= 0) {
      var result = artists[bestMatch];
      result.externalIds = { echonest: result.id };
      delete result.id;
      deferred.resolve(result);
      return;
    }

    deferred.reject(new Error("Artist '" + rawArtist + "' not found"));
  });

  return deferred.promise;
}

function getArtistName(artist) {
  return artist.name;
}

module.exports = artistUtils;