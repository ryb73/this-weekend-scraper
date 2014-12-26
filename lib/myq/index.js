"use strict";

var q = require("q");
var myq = Object.create(q);

myq.isSnapshotFulfilled = function isSnapshotFulfilled(snapshot) {
  switch(snapshot.state) {
    case "fulfilled":
      return true;
    case "rejected":
      return false;
    default:
      throw new Error("Invalid snapshot state: " + snapshot.state);
  }
};

module.exports = myq;