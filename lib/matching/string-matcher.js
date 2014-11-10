"use strict";

var stringMatcher = {};

var MATCHLEVEL_PERFECT = 100,
    MATCHLEVEL_PERFECT_NOCASE = 90,
    MATCHLEVEL_CLEAN_MATCH = 80,
    MATCHLEVEL_DEFAULT = 1,
    MATCHLEVEL_NONE = 0;


stringMatcher.findBestMatch = function findBestMatch(name, potentialMatches) {
  var result = -1,
      maxVal = -1;

  potentialMatches.forEach(function(match, i) {
    var tmp = compareNames(name, match);
    if(tmp > maxVal) {
      maxVal = tmp;
      result = i;
    }
  });

  return result;
};

function compareNames(one, two) {
  one = preprocess(one);
  two = preprocess(two);

  if(one.length === 0 || two.length === 0)
    return MATCHLEVEL_NONE;

  if(one === two)
    return MATCHLEVEL_PERFECT;

  one = one.toLowerCase();
  two = two.toLowerCase();

  if(one === two)
    return MATCHLEVEL_PERFECT_NOCASE;

  one = cleanName(one);
  two = cleanName(two);

  if(one === two)
    return MATCHLEVEL_CLEAN_MATCH;

  return MATCHLEVEL_DEFAULT;
}

function preprocess(name) {
  return name.trim();
}

function cleanName(name) {
  name = name.replace(/[^\w\s\d&\+]/g, " ");
  name = name.replace(/[&\+]/g, " and ");
  name = name.replace(/\s{2,}/g, " ");
}

module.exports = stringMatcher;