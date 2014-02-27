'use strict';

// a simple wrapper around a single arraybuffer

module.exports = Buffer;

function Buffer(buffer, keepBuffer) {
    if (!buffer) {
        this.array = new ArrayBuffer(this.defaultLength);
        this.length = this.defaultLength;
        this.setupViews();

    } else {
        // we only recreate buffers after receiving them from workers for binding to gl,
        // so we only need these 2 properties
        this.array = buffer.array;
        this.pos = buffer.pos;
    }

    this.keepBuffer = keepBuffer;
    this.positions = [];
}

Buffer.prototype = {
    pos: 0,
    itemSize: 4, // bytes in one item
    defaultLength: 8192, // initial buffer size
    arrayType: 'ARRAY_BUFFER', // gl buffer type

    get index() {
        return this.pos / this.itemSize;
    },

    setupViews: function() {
        // set up views for each type to add data of different types to the same buffer
        this.ubytes = new Uint8Array(this.array);
        this.bytes = new Int8Array(this.array);
        this.ushorts = new Uint16Array(this.array);
        this.shorts = new Int16Array(this.array);
    },

    // binds the buffer to a webgl context
    bind: function(gl) {
        var type = gl[this.arrayType];
        if (!this.buffer) {

            this.glBufferSize = this.keepBuffer ? this.length : this.pos;
            this.buffer = gl.createBuffer();
            gl.bindBuffer(type, this.buffer);
            gl.bufferData(type, new DataView(this.array, 0, this.glBufferSize), gl.STATIC_DRAW);

            this.uploadedPos = this.pos;
            this.positions = [];

            if (!this.keepBuffer) {
                // dump array buffer once it's bound to gl
                this.array = new ArrayBuffer(this.defaultLength);
                this.length = this.defaultLength;
                this.pos = 0;
                this.setupViews();
            }

        } else {
            gl.bindBuffer(type, this.buffer);

            // Data has been appended to the buffer since the last bind.
            // Mark the appended portion so that it will be uploaded.
            if (this.keepBuffer && this.pos !== this.uploadedPos) {
                this.positions.push({
                    pos: this.uploadedPos,
                    start: this.uploadedPos,
                    end: this.pos
                });
                this.uploadedPos = this.pos;
            }

            // If the buffer has been updated since it was last bound, upload those changes
            if (this.positions.length) {
                // todo merge before uploading where possible
                for (var i = 0; i < this.positions.length; i++) {
                    var p = this.positions[i];
                    gl.bufferSubData(type, p.pos, new DataView(this.array, p.start, p.end - p.start));
                }
                this.positions = [];

                if (!this.keepBuffer) {
                    this.array = new ArrayBuffer(this.defaultLength);
                    this.length = this.defaultLength;
                    this.pos = 0;
                    this.setupViews();
                }
            }
        }
    },

    startUpdate: function(index) {

        if (this.keepBuffer) {
            this.endPos = this.pos;
            this.pos = index * this.itemSize;
        }

        if (this.buffer) this.positions.push({ pos: index * this.itemSize, start: this.pos });

        this._add = this.add;
        this.add = function() {
            this._add.apply(this, arguments);
        };
    },

    endUpdate: function() {
        if (this.buffer) {
            if (this.positions[this.positions.length - 1].start === this.pos) {
                this.positions.pop();
            } else {
                this.positions[this.positions.length - 1].end = this.pos;
            }
        }
        this.add = this._add;

        if (this.keepBuffer) {
            this.pos = this.endPos;
        }
    },

    // increase the buffer size by 50% if a new item doesn't fit
    resize: function() {
        if (this.length < this.pos + this.itemSize) {

            while (this.length < this.pos + this.itemSize) {
                // increase the length by 50% but keep it even
                this.length = Math.round(this.length * 1.5 / 2) * 2;
            }

            // array buffers can't be resized, so we create a new one and reset all bytes there
            this.array = new ArrayBuffer(this.length);

            var ubytes = new Uint8Array(this.array);
            ubytes.set(this.ubytes);

            this.setupViews();

            if (this.buffer && this.keepBuffer) {
                // todo gl.deleteBuffer()
                delete this.buffer;
            }
        }
    }
};
