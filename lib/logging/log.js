"use strict";

var bunyan = require("bunyan"),
    strftime = require("strftime");

var DATE_FORMAT = "%Y-%m-%d-%H-%M-%S";

module.exports = bunyan.createLogger({
  name: "index",
  streams: [
    {
      level: "info",
      stream: process.stdout
    },
    {
      level: "info",
      path: "log/" + strftime(DATE_FORMAT) + ".log"
    },
    {
      level: "error",
      path: "log/error/" + strftime(DATE_FORMAT) + ".log"
    }
  ]
});