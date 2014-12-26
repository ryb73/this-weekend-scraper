// TODO: this is pretty barebones/hacky for now

"use strict";

var log = require("./logging/log");

module.exports = function assert(expression) {
  if(expression) return;

  var args = [];
  var i;
  for(i = 0; i < arguments.length; ++i) {
    args[i] = arguments[i];
  }

  args[0] = module.parent.filename;

  log.error.apply(log, args);
};