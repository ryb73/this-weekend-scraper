"use strict";

var mongojs = require("mongojs"),
    q       = require("q"),
    echonest = require("../matching/echonest"),
    stringMatcher = require("../matching/string-matcher"),
    log = require("../logging/log");;

var artistUtils = {};

artistUtils.rawToDb = function rawToDb(rawArtist) {
  return getMatchedArtist(rawArtist)
    .then(function(artist) {
      return artist.id;
    });
};

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
      deferred.resolve(artists[bestMatch]);
      return;
    }

    deferred.reject(new Error("Artist not found"));
  });

  return deferred.promise;
}

function getArtistName(artist) {
  return artist.name;
}

module.exports = artistUtils;