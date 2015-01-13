"use strict";

require("error-tojson");

var express        = require("express"),
    cors           = require("cors"),
    mongojs        = require("mongojs"),
    happeningUtils = require("./lib/data/happening-utils"),
    artistUtils    = require("./lib/data/artist-utils"),
    config         = require("./config");

var app = express();

var db = initializeDatabase();
artistUtils.setCollection(db[config.artistsCollection]);
happeningUtils.setCollection(db[config.happeningsCollection]);

app.use(cors());

app.get("/api/happenings", function(request, response) {
  happeningUtils.query(request.query)
    .then(function(res) {
      response.json(res);
    })
    .catch(function(err) {
      console.log(err.stack);
      response.status(500).end();
    });
});

var server = app.listen(config.port, function() {
  console.log("Listening on http://%s:%d", server.address().address, server.address().port);
});

function initializeDatabase() {
  return mongojs(config.db, [
    config.artistsCollection,
    config.happeningsCollection
  ]);
}