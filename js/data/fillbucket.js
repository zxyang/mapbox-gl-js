'use strict';

var ElementGroups = require('./elementgroups.js');
var seidel = require('seidel');


module.exports = FillBucket;

function FillBucket(info, buffers, placement, elementGroups) {
    this.info = info;
    this.buffers = buffers;
    this.elementGroups = elementGroups || new ElementGroups(buffers.fillVertex, buffers.fillElement, buffers.outlineElement);
}

FillBucket.prototype.addFeatures = function() {
    var features = this.features;
    var fillVertex = this.buffers.fillVertex;
    var fillElement = this.buffers.fillElement;

    var n = 0;
    var elementGroups = this.elementGroups;

    function pointToString(a) { return '[' + a[0] + ',' + a[1] + ']'; }
    function ringsToString(a) { return '[' + a.map(pointToString).join(',') + ']'; }
    function stringifyData(a) { return '[' + a.map(ringsToString) + ']'; }

    var start = self.performance.now();

    var elementGroup;
    for (var i = features.length - 1; i >= 0; i--) {
        var feature = features[i];
        var lines = feature.loadGeometry();

        var data = [];

        // console.log('feature');

        for (var k = 0; k < lines.length; k++) {
            var vertices = lines[k];

            var contour = [];
            for (var m = 1; m < vertices.length; m++) {
                var x = vertices[m].x,
                    y = vertices[m].y;
                if (vertices[m - 1].x !== x || vertices[m - 1].y !== y) contour.push([x, y]);
            }
            data.push(contour);
        }

        var triangles = seidel(data);
        // if (!triangles) console.log('empty ' + stringifyData(data));

        for (k = 0; triangles && k < triangles.length; k++) {
            addVertex(triangles[k][0]);
            addVertex(triangles[k][1]);
            addVertex(triangles[k][2]);
        }
    }

    self.tesselateTime = self.tesselateTime || 0;
    self.tesselateTime += self.performance.now() - start;
    console.log(Math.round(self.tesselateTime) + ' ms');

    function addVertex(data) {
        if (n % 3 === 0) {
            elementGroups.makeRoomFor(10);
            elementGroup = elementGroups.current;
        }
        var index = fillVertex.index - elementGroup.vertexStartIndex;
        fillVertex.add(data.x, data.y);
        fillElement.add(index);
        elementGroup.elementLength++;
        n++;
    }
};

FillBucket.prototype.hasData = function() {
    return !!this.elementGroups.current;
};
