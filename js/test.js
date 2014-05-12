'use strict';

var WorkerTile = require('./worker/workertile.js');

exports.loadTile = window.loadTile = function (url, zoom, tileSize, buckets) {
    console.log(new WorkerTile(url, zoom, tileSize, buckets));
};
