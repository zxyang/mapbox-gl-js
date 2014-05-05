'use strict';

var LatLng = require('../geometry/latlng.js'),
    Point = require('../geometry/point.js');

var glmatrix = require('../lib/glmatrix.js');
var mat4 = glmatrix.mat4;
var vec4 = glmatrix.vec4;

module.exports = Transform;

/*
 * A single transform, generally used for a single tile to be scaled, rotated, and
 * zoomed.
 *
 * @param {number} tileSize
 */
function Transform(tileSize) {
    this.tileSize = tileSize; // constant

    this._minZoom = 0;
    this._maxZoom = 22;

    this.width = 0;
    this.height = 0;
    this.zoom = 0;
    this.center = new LatLng(0, 0);
    this.angle = 0;
    this.tilt = 0;//35;
    this.altitude = 200;
}

Transform.prototype = {

    // lon = ((((lon + 180) % 360) + 360) % 360) - 180;

    get minZoom() { return this._minZoom; },
    set minZoom(zoom) {
        this._minZoom = zoom;
        this.zoom = Math.max(this.zoom, zoom);
    },

    get maxZoom() { return this._maxZoom; },
    set maxZoom(zoom) {
        this._maxZoom = zoom;
        this.zoom = Math.min(this.zoom, zoom);
    },

    get worldSize() {
        return this.tileSize * this.scale;
    },

    get centerPoint() {
        return this.size._div(2);
    },

    get size() {
        return new Point(this.width, this.height);
    },

    get zoom() { return this._zoom; },
    set zoom(zoom) {
        zoom = Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
        this._zoom = zoom;
        this.scale = this.zoomScale(zoom);
        this.tileZoom = Math.floor(zoom);
        this.zoomFraction = zoom - this.tileZoom;
    },

    zoomScale: function(zoom) { return Math.pow(2, zoom); },
    scaleZoom: function(scale) { return Math.log(scale) / Math.LN2; },

    get x() { return this.lngX(this.center.lng); },
    get y() { return this.latY(this.center.lat); },

    get point() { return new Point(this.x, this.y); },

    // lat/lon <-> absolute pixel coords convertion
    lngX: function(lon) {
        return (180 + lon) * this.worldSize / 360;
    },
    // latitude to absolute y coord
    latY: function(lat) {
        var y = 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
        return (180 - y) * this.worldSize / 360;
    },
    xLng: function(x, worldSize) {
        return x * 360 / (worldSize || this.worldSize) - 180;
    },
    yLat: function(y, worldSize) {
        var y2 = 180 - y * 360 / (worldSize || this.worldSize);
        return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90;
    },

    panBy: function(offset) {
        var point = this.centerPoint._add(offset);
        this.center = this.pointLocation(point);
    },

    zoomAroundTo: function(zoom, p) {
        var p1 = this.size._sub(p),
            latlng = this.pointLocation(p1);
        this.zoom = zoom;
        this.panBy(p1.sub(this.locationPoint(latlng)));
    },

    locationPoint: function(latlng) {
        var p = new Point(
            this.lngX(latlng.lng),
            this.latY(latlng.lat));

        return this.centerPoint._sub(this.point._sub(p)._rotate(this.angle));
    },

    pointLocation: function(p) {
        var p2 = this.centerPoint._sub(p)._rotate(-this.angle);
        return new LatLng(
            this.yLat(this.y - p2.y),
            this.xLng(this.x - p2.x));
    },

    locationCoordinate: function(latlng) {
        var k = this.zoomScale(this.tileZoom) / this.worldSize;
        return {
            column: this.lngX(latlng.lng) * k,
            row: this.latY(latlng.lat) * k,
            zoom: this.tileZoom
        };
    },

    pointCoordinate: function(p) {
        var m = this.coordinatePointMatrix(this.tileZoom);

        // This could definitely be more elegant
        // or at least understandable

        // We know:
        // the matrix, unprojected z, y (0, 1), and projected x, y (point)
        // We don't know:
        // the unprojected x, y (which we want), and the projected z, y
        //
        // Solve 3 equations with three unknowns

        // Terrible temporary hack to avoid division by 0
        if (p.x === 0) p.x = -1;
        if (p.y === 0) p.y = -1;

        var f1 = m[0] / m[1];
        var g1 = p.x - f1 * p.y;
        // 0 = a1 * x + b1 * y + c1
        var a1 = m[3];
        var b1 = m[7] - (m[4] - f1 * m[5]) / g1;
        var c1 = m[15] - (m[12] - f1 * m[13]) / g1;

        if (m[1] === 0) {
            a1 = m[3];
            b1 = m[7] - m[5] / p.y;
            c1 = m[15] - m[13] / p.y;
        }

        var f2 = m[4] / m[5];
        var g2 = p.x - f2 * p.y;
        // 0 = a2 * x + b2 * y + c2
        var a2 = m[3] - (m[0] - f2 * m[1]) / g2;
        var b2 = m[7];
        var c2 = m[15] - (m[12] - f2 * m[13]) / g2;

        if (m[5] === 0) {
            a2 = m[3] - m[1] / p.y;
            b2 = m[7];
            c2 = m[15] - m[13] / p.y;
        }

        var f3 = a1 / a2;
        var b3 = b1 - f3 * b2;
        var c3 = c1 - f3 * c2;
        var y = -c3 / b3;

        var x = a1 !== 0 ?
            -(b1 * y + c1) / a1 :
            -(b2 * y + c2) / a2;

        return {
            column: x,
            row: y,
            zoom: this.tileZoom
        };
    },

    coordinatePoint2: function(p) {
        var z = p[2];
        var m = this.coordinatePointMatrix(z);
        var v = [p[0] * 1, p[1] * 1, 0, 1];
        vec4.transformMat4(v, v, m);
        return new Point(v[0] / v[3], v[1]/v[3]);
    },

    coordinatePointMatrix: function(z) {
        var proj = this.getProjMatrix();
        var tileScale = Math.pow(2, z); // number of tiles along an edge at that z level
        var scale = this.worldSize / tileScale;
        mat4.scale(proj, proj, [scale, scale, 1]);
        mat4.multiply(proj, this.getPixelMatrix(), proj);
        return proj;
    },

    // converts pixel points to gl coords
    getPixelMatrix: function() {
        // gl coords to screen coords
        var m = mat4.create();
        mat4.scale(m, m, [this.width / 2, -this.height / 2, 1]);
        mat4.translate(m, m, [1, -1, 0]);
        return m;
    },

    getProjMatrix: function() {
        var m = new Float64Array(16);
        mat4.perspective(m, 2 * Math.atan((this.height / 2) / this.altitude), this.width/this.height, 0, this.altitude + 1);
        mat4.translate(m, m, [0, 0, -this.altitude]);
        mat4.scale(m, m, [1, -1, 1 / this.height]);
        mat4.rotateX(m, m, Math.PI / 180 * this.tilt);
        mat4.rotateZ(m, m, this.angle);
        mat4.translate(m, m, [-this.x, -this.y, 0]);
        return m;
    }
};
