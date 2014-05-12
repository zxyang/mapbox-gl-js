'use strict';

var WorkerTile = require('./worker/workertile.js');

exports.loadTile = function (url, id, zoom, tileSize, buckets, callback) {
    new WorkerTile(url, id, zoom, tileSize, buckets, callback);
};
