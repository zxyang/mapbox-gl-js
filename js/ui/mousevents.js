'use strict';

var evented = require('../lib/evented.js');

module.exports = MouseEvents;

evented(MouseEvents);

function MouseEvents(map) {
    this.map = map;
    this.map.canvas.addEventListener('click', this.click.bind(this));
    this.map.canvas.addEventListener('mousedown', this.mousedown.bind(this));
    this.map.canvas.addEventListener('mouseup', this.mouseup.bind(this));
    this.map.canvas.addEventListener('mousemove', this.mousemove.bind(this));
    this.map.canvas.addEventListener('mouseout', this.mouseout.bind(this));

    this.params = {
        geometry: true,
    };

    this.previous = {}; // features the mouse was over last time
}


MouseEvents.prototype.click = fireAtPoint('click');
MouseEvents.prototype.mousedown = fireAtPoint('mousedown');
MouseEvents.prototype.mouseup = fireAtPoint('mouseup');

function fireAtPoint(event_name) {
    return function(ev) {
        var mouseEvents = this;
        var hasListeners = this._events && this._events[event_name] && this._events[event_name].length;

        if (hasListeners) {
            this.map.featuresAt(ev.clientX, ev.clientY, this.params, function(err, features) {
                if (err) return;
                for (var i = 0; i < features.length; i++) {
                    mouseEvents.fire(event_name, [features[i]]);
                }
            });
        }
    };
}

// Mouse has moved on the canvas. Compare features at current position with
// features at the last position and fire mouse{move,over,out} events.
MouseEvents.prototype.mousemove = function(ev) {
    var mouseEvents = this;

    // Check if there are events registered. If there aren't,  don't query features
    var mousemove = this._events && this._events.mousemove && this._events.mousemove.length;
    var mouseover = this._events && this._events.mouseover && this._events.mouseover.length;
    var mouseout = this._events && this._events.mouseout && this._events.mouseout.length;

    if (mousemove || mouseover || mouseout) {

        this.map.featuresAt(ev.clientX, ev.clientY, this.params, function(err, features) {
            if (err) return;

            var current = {};
            var previous = mouseEvents.previous;

            for (var i = 0; i < features.length; i++) {
                var feature = features[i];
                var id = feature._bucket + feature.id;

                if (current[feature._tile] === undefined) current[feature._tile] = {};
                current[feature._tile][id] = feature;

                if (!previous[feature._tile] || !previous[feature._tile][id]) {
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

// Mouse has left the canvas, fire mouseout on all features
MouseEvents.prototype.mouseout = function() {
    for (var t in this.previous) {
        for (var f in this.previous[t]) {
            this.fire('mouseout', [this.previous[t][f]]);
        }
    }

    this.previous = {};
};
