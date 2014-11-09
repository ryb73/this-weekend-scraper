"use strict";

var bunyan = require("bunyan"),
    strftime = require("strftime");

module.exports = bunyan.createLogger({
  name: "index",
  streams: [
    {
      level: "info",
      stream: process.stdout
    },
    {
      level: "info",
      path: "log/" + strftime("%F-%T") + ".log"
    },
    {
      level: "error",
      path: "log/error/" + strftime("%F-%T") + ".log"
    }
  ]
});