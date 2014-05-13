'use strict';

var Geometry = require('../geometry/geometry.js');
var Bucket = require('../geometry/bucket.js');
var FeatureTree = require('../geometry/featuretree.js');
var Protobuf = require('pbf');
var VectorTile = require('../format/vectortile.js');
var VectorTileFeature = require('../format/vectortilefeature.js');
var Placement = require('../text/placement.js');
var bucketFilter = require('../style/bucket-filter.js');
var GlyphAtlas = require('../text/glyphatlas.js');

function loadBuffer(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            callback(null, xhr.response);
        } else {
            callback(xhr.statusText);
        }
    };
    xhr.send();
    return xhr;
}

module.exports = WorkerTile;

function WorkerTile(url, zoom, tileSize, buckets, callback) {
    var tile = this;
    this.url = url;
    this.zoom = zoom;
    this.tileSize = tileSize;

    this.buckets = buckets;

    for (var bucketId in buckets) {
        buckets[bucketId].fn = bucketFilter(buckets[bucketId], ['source', 'layer', 'feature_type']);
    }

    loadBuffer(url, function(err, data) {
        if (!err) {
            tile.data = new VectorTile(new Protobuf(new Uint8Array(data)));
            console.time('parse');
            tile.parse(tile.data);
            console.timeEnd('parse');
            callback(tile);
        }
    });
}

/*
 * Sorts features in a layer into different buckets, according to the maping
 *
 * Layers in vector tiles contain many different features, and feature types,
 * e.g. the landuse layer has parks, industrial buildings, forests, playgrounds
 * etc. However, when styling, we need to separate these features so that we can
 * render them separately with different styles.
 *
 * @param {VectorTileLayer} layer
 * @param {Mapping} mapping
 */
function sortFeaturesIntoBuckets(layer, mapping) {
    var buckets = {};

    for (var i = 0; i < layer.length; i++) {
        var feature = layer.feature(i);
        for (var key in mapping) {
            // Filter features based on the filter function if it exists.
            if (!mapping[key].fn || mapping[key].fn(feature)) {

                // Only load features that have the same geometry type as the bucket.
                var type = VectorTileFeature.mapping[feature._type];
                if (type === mapping[key].filter.feature_type || mapping[key][type]) {
                    if (!(key in buckets)) buckets[key] = [];
                    buckets[key].push(feature);
                }
            }
        }
    }

    return buckets;
}

WorkerTile.prototype.parseBucket = function(bucket_name, features, info, faces, layer) {
    var geometry = this.geometry;

    if (!info.text) return;
    var bucket = new Bucket(info, geometry, this.placement);

    bucket.start();

    if (info.text) {
        this.parseTextBucket(features, bucket, info, faces, layer);

    } else {
        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            bucket.addFeature(feature.loadGeometry());

            this.featureTree.insert(feature.bbox(), bucket_name, feature);
        }
    }

    bucket.end();

    return bucket;
};

WorkerTile.prototype.parseTextBucket = function(features, bucket, info, faces, layer) {
    // TODO: currently hardcoded to use the first font stack.
    // Get the list of shaped labels for this font stack.
    var stack = Object.keys(layer.shaping)[0];
    var shapingDB = layer.shaping[stack];
    if (!shapingDB) return;

    //console.time('placement');

    for (var i = 0; i < features.length; i++) {
        var feature = features[i];

        var text = feature[info['text-field']];
        if (!text) continue;

        var shaping = shapingDB[text];
        var lines = feature.loadGeometry();

        bucket.addFeature(lines, faces, shaping);

    }

};

var geometryTypeToName = [null, 'point', 'line', 'fill'];

function getGeometry(feature) {
    return feature.loadGeometry();
}

function getType(feature) {
    return geometryTypeToName[feature._type];
}


/*
 * Given tile data, parse raw vertices and data, create a vector
 * tile and parse it into ready-to-render vertices.
 *
 * @param {object} data
 * @param {function} respond
 */
WorkerTile.prototype.parse = function(tile) {
    var buckets = this.buckets;
    var layers = {};
    var name;

    this.geometry = new Geometry();
    this.placement = new Placement(this.geometry, this.zoom, this.tileSize);
    this.featureTree = new FeatureTree(getGeometry, getType);


    var glyphAtlas = new GlyphAtlas(1024, 1024);
    var rects = {};
    for (name in tile.faces) {
        var face = tile.faces[name];
        rects[name] = {};

        for (var id in face.glyphs) {
            // TODO: use real value for the buffer
            rects[name][id] = glyphAtlas.addGlyph(1, name, face.glyphs[id], 3);
        }
    }

    // Merge the rectangles of the glyph positions into the face object
    for (name in rects) {
        tile.faces[name].rects = rects[name];
    }

    // Find all layers that we need to pull information from.
    var sourceLayers = {},
        layerName;

    for (var bucket in buckets) {
        layerName = buckets[bucket].filter.layer;
        if (!sourceLayers[layerName]) sourceLayers[layerName] = {};
        sourceLayers[layerName][bucket] = buckets[bucket];
    }

    for (layerName in sourceLayers) {
        var layer = tile.layers[layerName];
        if (!layer) continue;

        var featuresets = sortFeaturesIntoBuckets(layer, sourceLayers[layerName]);

        // Build an index of font faces used in this layer.
        var faceIndex = [];
        for (var i = 0; i < layer.faces.length; i++) {
            faceIndex[i] = tile.faces[layer.faces[i]];
        }

        // All features are sorted into buckets now. Add them to the geometry
        // object and remember the position/length
        for (var key in featuresets) {
            var features = featuresets[key];
            var info = buckets[key];
            if (!info) {
                alert("missing bucket information for bucket " + key);
            } else {
                layers[key] = this.parseBucket(key, features, info, faceIndex, layer);
            }
        }
    }

    // Collect all buffers to mark them as transferable object.
    // var buffers = this.geometry.bufferList();

    // Convert buckets to a transferable format
    // var bucketJSON = {};
    // for (var b in layers) bucketJSON[b] = layers[b].toJSON();

    // we don't need anything except featureTree at this point, so we mark it for GC
    // this.geometry = null;
    // this.placement = null;
};
