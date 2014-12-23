"use strict";

var q = require("../myq/index"),
    echonest = require("../matching/echonest"),
    stringMatcher = require("../matching/string-matcher"),
    artistUtils = require("./artist-utils"),
    assert = require("../assert"),
    log = require("../logging/log");

var happeningUtils = {};

var collection;

function setCollection(happeningColletion) {
  collection = happeningColletion;

  collection.ensureIndex({
    "rssGuid": 1
  }, {unique: true}, checkError);
}
happeningUtils.setCollection = setCollection;

function checkError(err) {
  if(err)
    log.error(err);
}

function rawToDb(rawHappening) {
  return getBakedFromRaw(rawHappening)
    .then(function(happening) {
      if(happening) {
        return tryBakingArtists(happening);
      }

      return q.all([
               processRawArtistArray(rawHappening.headliners || []),
               processRawArtistArray(rawHappening.openers || [])
             ])
             .spread(setProcessedArtists.bind(null, rawHappening));
    })
    .then(postToDb);
}
happeningUtils.rawToDb = rawToDb;

function postToDb(happening) {
  if(isBaked(happening)) {
    log.fatal("welph");
    return publicPointer(happening);
  }

  // assume parbaked
  var deferred = q.defer();

  collection.insert(happening, function(err, doc) {
    if(err) {
      deferred.reject(err);
    } else {
      deferred.resolve(publicPointer(doc));
    }
  });

  return deferred.promise;
}

function getBakedFromRaw(rawHappening) {
  var deferred = q.defer();

  var criteria = {
    "rssGuid": rawHappening.rssGuid
  };

  collection.find(criteria, function(err, docs) {
    if(err) {
      deferred.reject(err);
      return;
    }

    if(docs.length > 1) {
      deferred.reject(new Error("Multiple happenings with same guid"));
      return;
    }

    if(docs.length === 1) {
      log.debug({match:docs[0],rssGuid:rawHappening.rssGuid}, "matched happening");
      deferred.resolve(docs[0]);
    } else {
      deferred.resolve(null);
    }
  });

  return deferred.promise;
}

function tryBakingArtists(happening) {
  return q.all([
      processArtistArray(happening.headliners || []),
      processArtistArray(happening.openers || [])
    ])
    .spread(setProcessedArtists.bind(null, happening));
}

function processArtistArray(artists) {
  return q.allSettled(artists.map(artistUtils.toDb))
    .then(processSettledArtists.bind(null, artists));
}

function processSettledArtists(artists, artistsSettled) {
  return artistsSettled.map(function(artistsSettled, index) {
    if(q.isSnapshotFulfilled(artistsSettled))
      return artistsSettled.value;
    else
      return artists[index];
  });
}

function setProcessedArtists(happening, headliners, openers) {
  happening.headliners = headliners;
  happening.openers = openers;

  return happening;
}

function processRawArtistArray(rawArtists) {
  return q.allSettled(rawArtists.map(artistUtils.rawToDb))
    .then(processSettledRawArtists.bind(null, rawArtists));
}

function processSettledRawArtists(rawArtists, artistsSettled) {
  return artistsSettled.map(function(artistSettled, index) {
    if(q.isSnapshotFulfilled(artistSettled))
      return artistSettled.value;
    else
      return artistUtils.adaptRaw(rawArtists[index]);
  });
}

function publicPointer(bakedHappening) {
  return { happeningId: bakedHappening._id };
}

function isBaked(happening) {
  return !!(happening && happening._id);
}

module.exports = happeningUtils;