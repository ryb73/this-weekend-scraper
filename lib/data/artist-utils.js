"use strict";

var q             = require("q"),
    echonest      = require("../matching/echonest"),
    stringMatcher = require("../matching/string-matcher"),
    log           = require("../logging/log");

var artistUtils = {};

var collection;

function setCollection(artistCollection) {
  collection = artistCollection;

  // TODO: generalize this
  collection.ensureIndex({
    "externalIds.id": 1, "externalIds.type": 1
  }, {unique: true}, checkError);

  collection.ensureIndex({
    "name": "text"
  }, checkError);
}
artistUtils.setCollection = setCollection;

function checkError(err) {
  if(err)
    log.error(err);
}

function toDb(artist) {
  if(isBaked(artist))
    return publicPointer(artist);

  if(isParbaked(artist))
    return rawToDb(artist.name);

  return rawToDb(artist);
}
artistUtils.toDb = toDb;

function rawToDb(rawArtist) {
  return getMatchedArtist(rawArtist)
    .then(postToDb);
}
artistUtils.rawToDb = rawToDb;

function postToDb(artist) {
  var deferred = q.defer();

  if(artist._id) {
    var criteria = { _id: artist._id };
    collection.update(criteria, artist);
    deferred.reject("welp");
    log.fatal("welp"); // don't know yet if this case even makes sense
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
          deferred.resolve(publicPointer(docs[0]));
        }
      });

      return;
    }

    // Nothing returned
    collection.insert(artist, function(err, doc) {
      if(err) {
        deferred.reject(err);
      } else {
        deferred.resolve(publicPointer(doc));
      }
    });
  });

  return deferred.promise;
}

function publicPointer(bakedArtist) {
  return { artistId: bakedArtist._id };
}

function getMatchedArtist(rawArtist) {
  var deferred = q.defer();

  echonest.findMatchingArtists(rawArtist, function(err, artists) {
    if(err) {
      log.info(err);
      deferred.reject(err);
      return;
    }

    var artistNames = artists.map(getArtistName);
    var bestMatch = stringMatcher.findBestMatch(rawArtist, artistNames);
    if(bestMatch >= 0) {
      var result = {
        name: artists[bestMatch].name,
        externalIds: [{
          type: "echonest",
          id: artists[bestMatch].id
        }]
      };

      deferred.resolve(result);

      log.info({ rawArtist: rawArtist, matchName: result.name }, "matched artist via echonest");
      return;
    }

    log.info({ rawArtist: rawArtist }, "failed to match");
    deferred.reject("Artist '" + rawArtist + "' not found");
  });

  return deferred.promise;
}

function getArtistName(artist) {
  return artist.name;
}

function adaptRaw(rawArtist) {
  return {
    name: rawArtist
  };
}
artistUtils.adaptRaw = adaptRaw;

function isBaked(artist) {
  return !!(artist && artist._id);
}

function isPointer(artist) {
  return !!(artist && artist.artistId);
}

function isParbaked(artist) {
  return !isBaked(artist) && !!(artist && artist.name);
}

module.exports = artistUtils;