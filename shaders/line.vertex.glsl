// these are the shaders for rendering antialiased lines
precision mediump float;

// floor(127 / 2) == 63.0
// the maximum allowed miter limit is 2.0 at the moment. the extrude normal is
// stored in a byte (-128..127). we scale regular normals up to length 63, but
// there are also "special" normals that have a bigger length (of up to 126 in
// this case).
#define scale 63.0

attribute vec2 a_pos;
attribute vec2 a_extrude;
attribute float a_linesofar;

// posmatrix is for the vertex position
uniform mat4 u_posmatrix;


uniform float u_debug;

// shared
uniform float u_ratio;
uniform vec2 u_linewidth;
uniform vec4 u_color;

varying float v_linesofar;
varying vec2 v_extrude;
varying float v_fadedist;
varying float v_outerdist;

uniform vec2 u_scale;

void main() {
    // Scale the extrusion vector down to a normal and then up by the line width
    // of this vertex.
    vec2 extrude = a_extrude / scale;
    vec2 dist = u_linewidth.s * extrude;

    // Remove the texture normal bit of the position before scaling it with the
    // model/view matrix. Add the extrusion vector *after* the model/view matrix
    // because we're extruding the line in pixel space, regardless of the current
    // tile's zoom level.
    gl_Position = u_posmatrix * vec4(floor(a_pos / 2.0) + dist / u_ratio, 0.0, 1.0);

    v_linesofar = a_linesofar * u_ratio;

    // Calculate fade edges for tilted
    // TODO compact it. It could be written much more concisely but leaving
    // it expanded until it is debugged and diagrammed.

    vec2 scale = vec2(1.0, 0.20);
    scale = u_scale;

    // Theta is the angle between the extrude and normal
    float cosTheta = 1.0 / max(length(extrude), 1.0);
    float sinTheta = sin(acos(cosTheta));

    // matrices for rotating in both directions
    mat2 r1 = mat2(cosTheta, -sinTheta, sinTheta, cosTheta);
    mat2 r2 = mat2(cosTheta, sinTheta, -sinTheta, cosTheta);

    // Calculate vectors of lines on either side
    vec2 l1 = (r1 * extrude).yx * vec2(1.0, -1.0);
    vec2 l2 = (r2 * extrude).yx * vec2(1.0, -1.0);

    // squash the vectors
    vec2 ex = extrude * scale * u_linewidth.s;
    l1 *= scale;
    l2 *= scale;

    // flip back to get normals perpendicular to squashed line
    vec2 n1 = l1.yx * vec2(-1.0, 1.0);
    vec2 n2 = l2.yx * vec2(-1.0, 1.0);

    // all we really want is the length of the normal
    // we get this be projecting ex onto the unscaled normals
    float len1 = dot(ex, n1) / length(n1);
    float len2 = dot(ex, n2) / length(n2);
    float fd1 = length(ex) / len1;
    float fd2 = length(ex) / len2;

    v_fadedist = max(fd1, fd2);
    v_outerdist = length(ex);
    v_extrude = ex;

}
