'use strict';

var test = require('tape');
var Point = require('point-geometry');
var interpolate = require('../../../js/symbol/interpolate');

test('Interpolate', function(t) {
    var points = [];
    for (var i = 0; i < 3; i++) {
        points.push(new Point(0, i));
    }
    t.deepEqual(interpolate(points, 10, 0.5, 16, 8, 4), []);
    t.deepEqual(interpolate(points, 0.5, 0.5, 16, 8, 0), [
        { angle: 1.5707963267948966, scale: 0.5, segment: 0, x: 0, y: 0.5 },
        { angle: 1.5707963267948966, scale: 8, segment: 1, x: 0, y: 1 },
        { angle: 1.5707963267948966, scale: 4, segment: 1, x: 0, y: 1.5 } ]);
    t.deepEqual(interpolate(points, 0.5 / 4, 0.5, 2, 8, 0.25 / 8), [
        { angle: 1.5707963267948966, scale: 0.5, segment: 0, x: 0, y: 0.25 },
        { angle: 1.5707963267948966, scale: 0.5, segment: 1, x: 0, y: 1.25 }
    ]);
    t.end();
});
