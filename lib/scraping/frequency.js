"use strict";

var request = require("request"),
    entities = require("entities"),
    FeedParser = require("feedparser"),
    q = require("q"),
    log = require("../logging/log"),    // TODO: think of better way to do this
    venues = require("./def/venues"),
    assert = require("../assert");

module.exports = function frequency() {
  var frequencyFeed = new FeedParser();

  var deferred = q.defer();

  // Make request
  request("http://madisonfrequency.com/home/rss")
    .on("error", function requestError(error) {
      deferred.reject(error);
    })
    .pipe(frequencyFeed);

  // Parse feed
  var result = [];
  frequencyFeed
    .on("error", function(err) {
      deferred.reject(err);
    })
    .on("data", function feedData(data) {
      result.push(parseHappening(data));
    })
    .on("end", function feedEnd() {
      deferred.resolve(result);
    });

  return deferred.promise;
};

function parseHappening(data) {
  var title = entities.decodeHTML(data.title);

  // Sometimes happenings will start with "X presents" or something of the sort
  title = title.replace(/.+? presents?:?\s*/, "");

  assert(title.length > 0, "title.length <= 0", data.title);

  // The headliner goes in front and openers are separated by a "w/" or "+"
  var titlePieces = title.split(/\s*(?:\s[wW]\/|\+)\s*(?:special guests?\s*)?/);
  var headliner = titlePieces[0],
      openers = titlePieces[1];

  assert(titlePieces.length <= 2, "titlePieces.length > 2", data.title);

  // Multiple openers are separated by commas
  if(openers)
    openers = openers.split(/\s*,\s*/);

  return {
    venue: venues.frequency,
    rssGuid: data.guid,
    headliner: headliner,
    openers: openers
  };
}