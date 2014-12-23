"use strict";

var bunyan = require("bunyan"),
    strftime = require("strftime");

module.exports = bunyan.createLogger({
  name: "index",
  streams: [
    {
      level: "trace",
      stream: process.stdout
    },
    {
      level: "debug",
      path: "log/" + strftime("%F-%T") + ".log"
    },
    {
      level: "error",
      path: "log/error/" + strftime("%F-%T") + ".log"
    }
  ]
});