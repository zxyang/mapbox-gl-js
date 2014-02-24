'use strict';

module.exports = Bucket;

function Bucket(info, geometry, placement, indices, featureIndices) {

    this.info = info;
    this.geometry = geometry;
    this.placement = placement;
    this.indices = indices; // only used after transfer from worker
    this.featureIndices = featureIndices || {}; // after transfer
    this.index = 0;

    if (info.type === 'text') {
        this.addFeature = this.addText;

    } else if (info.type == 'point' && info.spacing) {
        this.addFeature = this.addMarkers;
        this.spacing = info.spacing || 100;

    } else if (info.type == 'point') {
        this.addFeature = this.addPoint;
        this.size = info.size;
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


Bucket.prototype.toJSON = function() {
    return {
        indices: this.indices,
        featureIndices: this.featureIndices
    };
};

Bucket.prototype.addMarkers = function(lines) {
    for (var i = 0; i < lines.length; i++) {
        this.geometry.addMarkers(lines[i], this.spacing);
    }
};

Bucket.prototype.addLine = function(lines) {
    var info = this.info;
    for (var i = 0; i < lines.length; i++) {
        this.geometry.addLine(lines[i], info.join, info.cap, info.miterLimit, info.roundLimit);
    }
};

Bucket.prototype.addFill = function(lines, id) {

    this.featureIndices[id] = this.getIndices();

    for (var i = 0; i < lines.length; i++) {
        this.geometry.addFill(lines[i]);
    }

    this.addEndIndices(this.featureIndices[id]);
};

Bucket.prototype.addPoint = function(lines) {
    for (var i = 0; i < lines.length; i++) {
        this.geometry.addPoints(lines[i], this.placement.collision,  this.size, this.padding);
    }
};

Bucket.prototype.addText = function(lines, faces, shaping) {
    for (var i = 0; i < lines.length; i++) {
        this.placement.addFeature(lines[i], this.info, faces, shaping);
    }
};

Bucket.prototype.addFeatureAt = function(index) {
    var vertex = this.geometry.fillBuffers[index.fillBufferIndex].vertex;

    var old = this.geometry.fillBufferIndex;
    this.geometry.setFillBuffers(index.fillBufferIndex);

    vertex.startUpdate(index.fillVertexIndex);
    this.addFeature.apply(this, Array.prototype.slice.call(arguments, 1));
    vertex.endUpdate();

    this.geometry.setFillBuffers(old);
};

Bucket.prototype.clear = function(indices) {
    // currently only works for fills
    var vertex = this.geometry.fillBuffers[indices.fillBufferIndex].vertex;
    var old = this.geometry.fillBufferIndex;
    this.geometry.setFillBuffers(indices.fillBufferIndex);

    vertex.startUpdate(indices.fillVertexIndex);

    var numVertices = indices.fillVertexIndexEnd - indices.fillVertexIndex;
    for (var i = 0; i < numVertices; i++) {
        vertex.addDegenerate();
    }
    vertex.endUpdate();
    this.geometry.setFillBuffers(old);
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
