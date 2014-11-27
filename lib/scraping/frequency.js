"use strict";

var request = require("request"),
    entities = require("entities"),
    FeedParser = require("feedparser"),
    q = require("q"),
    _ = require("lodash"),
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
  log.info({title: title}, "frequency: parsing title");

  // Sometimes happenings will start with "X presents" or something of the sort
  title = title.replace(/.+? presents?:?\s*/, "");

  assert(title.length > 0, "title.length <= 0", data.title);

  // The headliner goes in front and openers are separated by a "w/" or "+"
  // TODO: make this regex not terrible
  var titlePieces = title.split(/\s*(?:\s[wW]\/|\+|feat(?:uring)?)\s*(?:special guests?\s*)?/);
  var headliner = titlePieces[0],
      openerPieces = _.rest(titlePieces);

  // There may be multiple groups of openers separated by w/ or +
  var openers;
  if(openerPieces.join("").length > 0) // the title might just say "w/ special guests"
    openers = parseOpeners(openerPieces);

  var result = {
    venue: venues.frequency,
    rssGuid: data.guid,
    headliners: [ headliner ],
    openers: openers
  };

  log.info({parsed: result}, "frequency: parsed title");
  return result;
}

function parseOpeners(openerPieces) {
  var result = [];
  openerPieces.forEach(function(openerPiece) {
    result = result.concat(parseOpenerPiece(openerPiece));
  });

  return result;
}

function parseOpenerPiece(openerPiece) {
  // Multiple openers are separated by commas
  return openerPiece.split(/\s*,\s*/);
}