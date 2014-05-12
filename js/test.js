'use strict';

var WorkerTile = require('./worker/workertile.js');

exports.loadTile = function (url, id, zoom, tileSize, callback) {
    new WorkerTile(url, id, zoom, tileSize, callback);
};
