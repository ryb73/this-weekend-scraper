"use strict";

var q             = require("q"),
    echonest      = require("../matching/echonest"),
    stringMatcher = require("../matching/string-matcher"),
    log           = require("../logging/log");

var artistUtils = {};

var collection;

artistUtils.setCollection = function setCollection(artistCollection) {
  collection = artistCollection;

  // TODO: generalize this
  collection.ensureIndex({
    "externalIds.id": 1, "externalIds.type": 1
  }, {unique: true}, logError);

  collection.ensureIndex({
    name: "text"
  }, logError);
};

function logError(err) {
  log.error(err);
}

artistUtils.rawToDb = function rawToDb(rawArtist) {
  return getMatchedArtist(rawArtist)
    .then(postToDb);
};

function postToDb(artist) {
  var deferred = q.defer();

  if(artist._id) {
    var criteria = { _id: artist._id };
    collection.update(criteria, artist);
    deferred.reject("welp");
  } else if(artist.externalIds) {
    return postArtistNoId(artist);
  } else {
    deferred.reject(new Error("Can't post artist without ID"));
  }

  return deferred.promise;
}

function postArtistNoId(artist) {
  // I'm going to ignore the case where there are multiple external IDs
  // I'm also going to ignore the fact that duplicate docs may be created
  // if I ever add a second external ID type
  var criteria = {
    "externalIds.type": artist.externalIds[0].type,
    "externalIds.id": artist.externalIds[0].id
  };

  var deferred = q.defer();

  collection.find(criteria, function(err, docs) {
    if(err) {
      deferred.reject(err);
      return;
    }

    if(docs.length > 1) {
      deferred.reject(new Error("Got more than one doc for ID " + artist.externalIds[0].id));
      return;
    }

    if(docs.length == 1) {
      collection.update(criteria, artist, null, function(err) {
        if(err) {
          deferred.reject(err);
        } else {
          deferred.resolve(docs[0]._id);
        }
      });

      return;
    }

    // Nothing returned
    collection.insert(artist, function(err, doc) {
      if(err) {
        deferred.reject(err);
      } else {
        deferred.resolve(doc._id);
      }
    });
  });

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
      result.externalIds = [{
        type: "echonest",
        id: result.id
      }];
      delete result.id;
      deferred.resolve(result);

      log.info({ rawArtist: rawArtist, matchName: result.name }, "matched artist via echonest");
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