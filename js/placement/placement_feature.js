'use strict';

var bboxify = require('bboxify-labels');

module.exports = PlacementFeature;

function PlacementFeature(geometry, anchor, left, right, top, bottom, alignWithLine, id) {

    this.id = id;

    // TODO remove?
    this.id = (this.id + Math.pow(2, 31)) % Math.pow(2, 32) - Math.pow(2, 31);

    this.anchor = anchor;

    if (alignWithLine) {

        var height = bottom - top;
        var length = right - left;

        this.boxes = bboxify.bboxifyLabel(geometry, anchor, length, height);

    } else {
        this.boxes = [{
            x: anchor.x,
            y: anchor.y,
            maxScale: Infinity,
            x1: left,
            x2: right,
            y1: top,
            y2: bottom
        }];
    }
}
