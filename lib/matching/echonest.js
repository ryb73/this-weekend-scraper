"use strict";

var rem = require("rem");

if(!process.env.WKND_ECHONEST_KEY)
  throw new Error("Echonest service: app key should be defined in $WKND_ECHONEST_KEY var");

var config = {
  key: process.env.WKND_ECHONEST_KEY
};

var echonest = {};

echonest.findMatchingArtists = function findMatchingArtists(artist, callback) {
  var echoService = rem.connect("echonest.com", "4").configure(config);

  var searchParams = {
    name: artist
  };

  echoService("artist/search").get(searchParams,
    function(err, json) {
      if(err) {
        var errObj = new Error("Error in echonest service: " + err +
                                "-" + json.response.status.message);
        callback(errObj);
        return;
      }

      callback(null, json.response.artists);
    });
};

module.exports = echonest;