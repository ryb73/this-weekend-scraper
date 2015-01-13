"use strict";

var q             = require("q"),
    log           = console;

var artistUtils = {};

var collection;

function setCollection(artistCollection) {
  collection = artistCollection;
}
artistUtils.setCollection = setCollection;

function checkError(err) {
  if(err)
    log.error(err);
}

function isPointer(artist) {
  return !!(artist && ("artistId" in artist));
}

function resolveArtist(artist) {
  if(!isPointer(artist))
    return artist;

  var deferred = q.defer();

  var criteria = {
    _id: artist.artistId
  };

  collection.find(criteria, function(err, docs) {
    if(err) {
      deferred.reject(err);
      return;
    }

    if(docs.length === 0) {
      deferred.reject(new Error("Artist ID " + criteria._id + "not found"));
      return;
    }

    deferred.resolve(docs[0]);
  });

  return deferred.promise;
}
artistUtils.resolveArtist = resolveArtist;

module.exports = artistUtils;