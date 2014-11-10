"use strict";

var request = require("request"),
    entities = require("entities"),
    FeedParser = require("feedparser"),
    log = require("../logging/log"),    // TODO: think of better way to do this
    venues = require("./def/venues"),
    assert = require("../assert");

module.exports = function frequency(callback) {
  var frequencyFeed = new FeedParser();

  // Make request
  request("http://madisonfrequency.com/home/rss")
    .on("error", function requestError(error) {
      console.log("error: " + error);
    })
    .pipe(frequencyFeed);

  // Parse feed
  var res = [];
  frequencyFeed
    .on("data", function feedData(data) {
      res.push(parseEvent(data));
    })
    .on("end", function feedEnd() {
      callback(res);
    });
};

function parseEvent(data) {
  var title = entities.decodeHTML(data.title);

  // Sometimes events will start with "X presents" or something of the sort
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