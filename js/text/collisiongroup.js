'use strict';

var Collision = require('./collision.js');

module.exports = CollisionGroup;

function CollisionGroup(zoom, tileExtent, tileSize, placementDepth) {
    this.tileSize = tileSize;
    this.tileExtent = tileExtent;
    this.tilePixelRatio = tileExtent / tileSize;
    this.zoom = zoom;
    placementDepth = Math.min(3, placementDepth || 1, 25.5 - this.zoom);
    this.maxPlacementScale = Math.exp(Math.LN2 * placementDepth);
    this.placementDepth = placementDepth;

    this.collisions = {};
    this.collisions.default = new Collision(zoom, tileExtent, tileSize, placementDepth);
}

// Get an array of Collision objects matching an array of groupnames.
CollisionGroup.prototype.group = function(names) {
    var group = [];
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (!this.collisions[name]) {
            this.collisions[name] = new Collision(this.zoom, this.tileExtent, this.tileSize, this.placementDepth);
        }
        group.push(this.collisions[name]);
    }
    return group;
};

