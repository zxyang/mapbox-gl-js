'use strict';

var evented = require('../lib/evented.js');

module.exports = MouseEvents;

evented(MouseEvents);

function MouseEvents(map) {
    this.map = map;
    this.map.canvas.addEventListener('mousemove', this.mousemove.bind(this));
    this.map.canvas.addEventListener('mouseout', this.mouseout.bind(this));

    this.previous = {}; // features the mouse was over last time
}


// Mouse has moved on the canvas. Compare features at current position with
// features at the last position and trigger mouse{move,over,out} events.
MouseEvents.prototype.mousemove = function(ev) {
    var mouseEvents = this;
    var previous = this.previous;

    // Check if there are events registered. If there aren't,  don't query features
    var mousemove = this._events && this._events.mousemove && this._events.mousemove.length;
    var mouseover = this._events && this._events.mouseover && this._events.mouseover.length;
    var mouseout = this._events && this._events.mouseout && this._events.mouseout.length;

    if (mousemove || mouseover || mouseout) {

        this.map.featuresAt(ev.clientX, ev.clientY, {
            geometry: true,
            radius: 5
        }, function(err, features) {
            if (err) return;

            var current = {};

            for (var i = 0; i < features.length; i++) {
                var feature = features[i];

                if (current[feature._tile] === undefined) current[feature._tile] = {};
                current[feature._tile][feature.id] = feature;

                if (!previous[feature._tile] || !previous[feature._tile][feature.id]) {
                    mouseEvents.fire('mouseover', [feature]);
                }

                mouseEvents.fire('mousemove', [feature]);
            }

            for (var t in previous) {
                for (var f in previous[t]) {
                    if (!current[t] || !current[t][f]) {
                        mouseEvents.fire('mouseout', [previous[t][f]]);
                    }
                }
            }

            mouseEvents.previous = current;
        });
    }
};

// Mouse has left the canvas, trigger mouseout on all features
MouseEvents.prototype.mouseout = function() {
    for (var f in this.previous) {
        this.fire('mouseout', [this.previous[f]]);
    }

    this.previous = {};
};
