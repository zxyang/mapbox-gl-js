'use strict';

module.exports = FadePlacementLayer;

function FadePlacementLayer(oldBuffers, newBuffers, oldPlacementBuffers, newPlacementBuffers, transform) {
    var newGlyph = newBuffers.glyphFade;
    var newIcon = newBuffers.iconFade;
    var oldGlyph = oldBuffers.glyphFade;
    var glyphUbytes = new Uint8Array(newGlyph.array);
    var oldGlyphUbytes = new Uint8Array(oldGlyph.array);
    //var iconUbytes = new Uint8Array(newIcon.array);
    newGlyph.referenceTime = newIcon.referenceTime = Date.now();
    var sinceOld = Date.now() - oldGlyph.referenceTime;

    for (var id in newPlacementBuffers) {
        if (!oldPlacementBuffers[id]) continue;

        var newTextPlacement = new Int32Array(newPlacementBuffers[id].text);
        var oldTextPlacement = new Int32Array(oldPlacementBuffers[id].text);

        glyphUbytes.id = id;

        var size = 8;
        var oldPos = 0;
        var newPos = 0;
        while (oldPos < oldTextPlacement.length && newPos < newTextPlacement.length) {
            var oldID = oldTextPlacement[oldPos];
            var newID = newTextPlacement[newPos];

            if (oldID === newID) {
                var oldPosp = oldPos;
                while (oldTextPlacement[oldPosp] === newID) {
                    if (oldTextPlacement[oldPosp + 2] === newTextPlacement[newPos + 2] &&
                        oldTextPlacement[oldPosp + 3] === newTextPlacement[newPos + 3]) {

                        fadeSymbol(oldGlyphUbytes, glyphUbytes, oldTextPlacement,
                                newTextPlacement, oldPosp, newPos, transform.zoom, sinceOld);

                        newPos += size;
                        break;
                    }
                    oldPosp += size;
                }

                if (oldTextPlacement[oldPosp] !== newID) {
                    oldPos += size;
                }

            } else if (oldID < newID) {
                oldPos += size;
            } else {
                //console.log('no match', newID);
                newPos += size;
            }
        }
    }
}

function updateBuffer(ubytes, vertexOffset, vertexLength, value, opacity) {
    var size = 4;
    for (var v = 0; v < vertexLength; v++) {
        ubytes[(vertexOffset + v) * size + 1] = Math.min(255, Math.max(0, value));
        ubytes[(vertexOffset + v) * size + 3] = Math.min(255, Math.max(0, opacity * 255));
    }
}

function fadeSymbol(oldUbytes, newUbytes, oldPlacement, newPlacement, oldPos, newPos, zoom, sinceOld) {
    var oldVertexOffset = oldPlacement[oldPos + 6];
    var oldZoom = oldUbytes[oldVertexOffset * 4];
    var oldFadeIn = oldUbytes[oldVertexOffset * 4 + 1];
    var oldOpacity = oldUbytes[oldVertexOffset * 4 + 3] / 255;

    var opacity = zoom * 10 >= oldZoom ? (oldFadeIn + sinceOld) / 300 + oldOpacity : 0;
    var newFadeIn = 0;

    var vertexOffset = newPlacement[newPos + 6];
    var vertexLength = newPlacement[newPos + 7];
    updateBuffer(newUbytes, vertexOffset, vertexLength, newFadeIn, opacity);

}
