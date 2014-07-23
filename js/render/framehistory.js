'use strict';

module.exports = FrameHistory;

function FrameHistory() {
    this.array = new Uint8Array(256);
    this.times = new Uint32Array(256);
    this.startTime = new Date().getTime();
    this.previousZoom = 0;
}

FrameHistory.prototype.record = function(zoom) {
    zoom = Math.floor(zoom * 10);
    var now = new Date().getTime() - this.startTime;

    var z;
    if (zoom < this.previousZoom) {
        for (z = zoom + 1; z <= this.previousZoom; z++) {
            this.times[z] = now;
        }
    } else {
        for (z = zoom; z > this.previousZoom; z--) {
            this.times[z] = now;
        }
    }

    for (z = 0; z < 256; z++) {
        var timeSince = Math.min(255, (now - this.times[z]));
        if (z <= zoom) {
            this.array[z] = timeSince;
        } else {
            this.array[z] = 255 - timeSince;
        }
    }

    this.changed = true;
    this.previousZoom = zoom;
};

FrameHistory.prototype.bind = function(gl) {
    if (!this.texture) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, 256, 1, 0, gl.ALPHA, gl.UNSIGNED_BYTE, this.array);

    } else {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        if (this.changed) {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.ALPHA, gl.UNSIGNED_BYTE, this.array);
            this.changed = false;
        }
    }
};
