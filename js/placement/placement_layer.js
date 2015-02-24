'use strict';

module.exports = PlacementLayer;

function PlacementLayer() {
    this.features = [];
    this.idMap = {};
}

PlacementLayer.prototype.add = function(placementFeature) {
    this.features.push(placementFeature);
    this.idMap[placementFeature.id] = placementFeature;
};


PlacementLayer.prototype.getArrayBuffer = function() {

    // create an arraybuffer the right length

    var idMap = this.idMap;
    var ids = Object.keys(idMap).map(function(d) { return parseInt(d); });
    ids.sort(function(a, b) { return a - b; });

    var buffer = new ArrayBuffer(ids.length * 32);
    var int32Array = new Int32Array(buffer);

    var pos = 0;

    for (var k = 0; k < ids.length; k++) {
        var id = ids[k];
        var feature = idMap[id];

        int32Array[pos] = feature.id;
        int32Array[pos + 2] = feature.anchor.x;
        int32Array[pos + 3] = feature.anchor.y;
        int32Array[pos + 4] = feature.placementZoom * 10;
        int32Array[pos + 5] = 0;
        int32Array[pos + 6] = feature.vertexOffset;
        int32Array[pos + 7] = feature.vertexLength;

        pos += 8;
    }

    return buffer;
};
