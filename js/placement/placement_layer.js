'use strict';

module.exports = PlacementLayer;

function PlacementLayer() {
    this.features = [];
}

PlacementLayer.prototype.add = function(placementFeature) {
    this.features.push(placementFeature);
};


PlacementLayer.prototype.getArrayBuffer = function() {

    var features = this.features.slice();
    features.sort(byID);

    var buffer = new ArrayBuffer(features.length * 32);
    var int32Array = new Int32Array(buffer);

    var pos = 0;

    for (var k = 0; k < features.length; k++) {
        var feature = features[k];

        int32Array[pos] = feature.id;
        int32Array[pos + 1] = feature.anchor.x;
        int32Array[pos + 2] = feature.anchor.y;
        int32Array[pos + 3] = feature.placementZoom * 10;
        int32Array[pos + 4] = feature.vertexOffset;
        int32Array[pos + 5] = feature.vertexLength;
        int32Array[pos + 6] = 0;

        pos += 8;
    }

    return buffer;
};

function byID(a, b) {
    return a.id - b.id;
}
