"use strict";

var frequency = require("./lib/scraping/frequency"),
    echonest = require("./lib/matching/echonest"),
    stringMatcher = require("./lib/matching/string-matcher"),
    log = require("./lib/logging/log");

frequency(matchArtistNames);

function matchArtistNames(eventData) {
  eventData.forEach(function(eventRecord) {
    echonest.findMatchingArtists(eventRecord.headliner, function(err, artists) {
      if(err) {
        log.error(err);
        return;
      }

      var artistNames = artists.map(getArtistName);
      var bestMatch = stringMatcher.findBestMatch(eventRecord.headliner, artistNames);
      if(bestMatch >= 0) {
        log.info({match:artists[bestMatch]});
      }
    });
  });
}

function getArtistName(artist) {
  return artist.name;
}