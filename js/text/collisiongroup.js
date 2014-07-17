'use strict';

var Collision = require('./collision.js');

module.exports = CollisionGroup;

function CollisionGroup(zoom, tileExtent, tileSize) {
    this.tileSize = tileSize;
    this.tileExtent = tileExtent;
    this.tilePixelRatio = tileExtent / tileSize;
    this.zoom = zoom;
    this.maxPlacementScale = Math.exp(Math.LN2 * Math.min((25.5 - this.zoom), 3));

    this.collisions = {};
    this.collisions.default = new Collision(zoom, tileExtent, tileSize);
}

// Get an array of Collision objects matching an array of groupnames.
CollisionGroup.prototype.group = function(names) {
    var group = [];
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (!this.collisions[name]) {
            this.collisions[name] = new Collision(this.zoom, this.tileExtent, this.tileSize);
        }
        group.push(this.collisions[name]);
    }
    return group;
};

