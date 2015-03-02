'use strict';

module.exports = Bounds;

var Point = require('point-geometry');

function Bounds(a, b) {
    if (!a) return;

    var points = b ? [a, b] : a;

    for (var i = 0, len = points.length; i < len; i++) {
        this.extend(points[i]);
    }
}

Bounds.prototype = {

    // extend the bounds to contain the given point
    extend: function(point) {
        point = new Point(point.x, point.y);

        if (!this.min && !this.max) {
            this.min = point.clone();
            this.max = point.clone();
        } else {
            this.min.x = Math.min(point.x, this.min.x);
            this.max.x = Math.max(point.x, this.max.x);
            this.min.y = Math.min(point.y, this.min.y);
            this.max.y = Math.max(point.y, this.max.y);
        }
        return this;
    },

    getCenter: function (round) { // (Boolean) -> Point
        return new Point(
            (this.min.x + this.max.x) / 2,
            (this.min.y + this.max.y) / 2, round
        );
    },

    getBottomLeft: function() { // -> Point
        return new Point(this.min.x, this.max.y);
    },

    getTopRight: function() { // -> Point
        return new Point(this.max.x, this.min.y);
    },

    getSize: function() {
        return this.max.sub(this.min);
    },

    contains: function(obj) { // (Bounds) or (Point) -> Boolean
        var min, max;

        if (typeof obj[0] === 'number' || obj instanceof Point) {
            obj = new Point(obj);
        } else {
            obj = new Bounds(obj);
        }

        if (obj instanceof Bounds) {
            min = obj.min;
            max = obj.max;
        } else {
            min = max = obj;
        }

        return (min.x >= this.min.x) &&
            (max.x <= this.max.x) &&
            (min.y >= this.min.y) &&
            (max.y <= this.max.y);
    },

    intersects: function(bounds) { // (Bounds) -> Boolean
        bounds = new Bounds(bounds);

        var min = this.min,
            max = this.max,
            min2 = bounds.min,
            max2 = bounds.max,
            xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
            yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

        return xIntersects && yIntersects;
    },

    isValid: function() {
        return !!(this.min && this.max);
    }
};

Bounds = function (a, b) { // (Bounds) or (Point, Point) or (Point[])
    if (!a || a instanceof Bounds) return a;
    return new Bounds(a, b);
};
