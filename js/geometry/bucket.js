'use strict';

module.exports = Bucket;

var interpolate = require('./interpolate.js');

function Bucket(info, geometry, placement, indices, featureIndices) {

    this.info = info;
    this.geometry = geometry;
    this.placement = placement;
    this.indices = indices; // only used after transfer from worker
    this.featureIndices = featureIndices || {}; // after transfer
    this.index = 0;

    if (info.type === 'text') {
        this.addFeature = this.addText;

    } else if (info.type == 'point') {
        this.addFeature = this.addPoint;
        this.size = info.size;
        this.spacing = info.spacing;
        this.padding = info.padding || 2;

    } else if (info.type == 'line') {
        this.addFeature = this.addLine;

    } else if (info.type == 'fill') {
        this.addFeature = this.addFill;

    } else {
        console.warn('unrecognized type');
    }

    var compare = info.compare || '==';
    if (compare in comparators) {
        var code = comparators[compare](info);
        if (code) {
            /* jshint evil: true */
            this.compare = new Function('feature', code);
        }
    }

}

Bucket.prototype.start = function() {
    this.indices = this.getIndices();
};

Bucket.prototype.end = function() {
    this.addEndIndices(this.indices);
};

Bucket.prototype.getIndices = function() {
    var geometry = this.geometry;

    return {
        lineVertexIndex: geometry.lineVertex.index,

        fillBufferIndex: geometry.fillBufferIndex,
        fillVertexIndex: geometry.fillVertex.index,
        fillElementsIndex: geometry.fillElements.index,

        glyphVertexIndex: geometry.glyphVertex.index,

        pointVertexIndex: geometry.pointVertex.index
    };
};


Bucket.prototype.addEndIndices = function(indices) {
    var geometry = this.geometry;

    indices.lineVertexIndexEnd = geometry.lineVertex.index;

    indices.fillBufferIndexEnd = geometry.fillBufferIndex;
    indices.fillVertexIndexEnd = geometry.fillVertex.index;
    indices.fillElementsIndexEnd = geometry.fillElements.index;

    indices.glyphVertexIndexEnd = geometry.glyphVertex.index;

    indices.pointVertexIndexEnd = geometry.pointVertex.index;
};

Bucket.prototype.startUpdate = function(p) {
    var old = this.getIndices();
    var geometry = this.geometry;
    geometry.setFillBuffers(p.fillBufferIndex);
    geometry.fillVertex.startUpdate(p.fillVertexIndex);
    //geometry.fillElements.startUpdate(p.fillElementsIndex);
    geometry.lineVertex.startUpdate(p.lineVertexIndex);
    geometry.pointVertex.startUpdate(p.pointVertexIndex);
    geometry.glyphVertex.startUpdate(p.glyphVertexIndex);
    return old;
};

Bucket.prototype.endUpdate = function(p) {
    var geometry = this.geometry;
    geometry.fillVertex.endUpdate();
    //geometry.fillElements.endUpdate();
    geometry.lineVertex.endUpdate();
    geometry.pointVertex.endUpdate();
    geometry.glyphVertex.endUpdate();
    geometry.setFillBuffers(p.fillBufferIndex);
};

Bucket.prototype.toJSON = function() {
    return {
        indices: this.indices,
        featureIndices: this.featureIndices
    };
};

Bucket.prototype.addLine = function(lines, id) {
    var info = this.info;
    this.featureIndices[id] = this.getIndices();
    for (var i = 0; i < lines.length; i++) {
        this.geometry.addLine(lines[i], info.join, info.cap, info.miterLimit, info.roundLimit);
    }
    this.addEndIndices(this.featureIndices[id]);
};

Bucket.prototype.addFill = function(lines, id) {

    this.featureIndices[id] = this.getIndices();
    for (var i = 0; i < lines.length; i++) {
        this.geometry.addFill(lines[i]);
    }
    this.addEndIndices(this.featureIndices[id]);
};

Bucket.prototype.addPoint = function(lines, id) {
    this.featureIndices[id] = this.getIndices();
    for (var i = 0; i < lines.length; i++) {

        var points = lines[i];
        if (this.spacing) points = interpolate(points, this.spacing, 1, 1);

        if (this.size) {
            var ratio = 8, // todo uhardcode tileExtent/tileSize
                x = this.size.x / 2 * ratio,
                y = this.size.y / 2 * ratio;

            for (var k = 0; k < points.length; k++) {
                var point = points[k];

                var glyphs = [{
                    box: { x1: -x, x2: x, y1: -y, y2: y },
                    minScale: 1,
                    anchor: point
                }];

                var placement = this.placement.collision.place(glyphs, point, 1, 16, this.padding);
                if (placement) {
                    this.geometry.addPoints([point], placement);
                }
            }

        } else {
            this.geometry.addPoints(points);
        }
    }
    this.addEndIndices(this.featureIndices[id]);
};

Bucket.prototype.addText = function(lines, faces, shaping) {
    for (var i = 0; i < lines.length; i++) {
        this.placement.addFeature(lines[i], this.info, faces, shaping);
    }
};

Bucket.prototype.addFeatureAt = function(indices, lines, id) {

    var old = this.startUpdate(indices);
    var oldIndex = this.featureIndices[id];
    this.addFeature.apply(this, Array.prototype.slice.call(arguments, 1));
    this.featureIndices[id] = oldIndex;
    this.endUpdate(old);
};

Bucket.prototype.clear = function(indices) {
    // currently only works for fills
    var old = this.startUpdate(indices);

    for (var i = indices.fillVertexIndex; i < indices.fillVertexIndexEnd; i++) {
        this.geometry.fillVertex.addDegenerate();
    }
    for (var k = indices.lineVertexIndex; k < indices.lineVertexIndexEnd; k++) {
        this.geometry.lineVertex.addDegenerate();
    }
    for (var j = indices.pointVertexIndex; j < indices.pointVertexIndexEnd; j++) {
        this.geometry.pointVertex.addDegenerate();
    }

    this.endUpdate(old);
};

// Builds a function body from the JSON specification. Allows specifying other compare operations.
var comparators = {
    '==': function(bucket) {
        if (!('field' in bucket)) return;
        var value = bucket.value, field = bucket.field;
        return 'return ' + (Array.isArray(value) ? value : [value]).map(function(value) {
            return 'feature[' + JSON.stringify(field) + '] == ' + JSON.stringify(value);
        }).join(' || ') + ';';
    }
};
