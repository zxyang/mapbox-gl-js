precision mediump float;

attribute vec2 a_pos;
uniform mat4 u_posmatrix;
uniform vec2 u_world;
uniform float u_z;

varying vec2 v_pos;

void main() {
    // If the x coordinate is the maximum integer, we move the z coordinates out
    // of the view plane so that the triangle gets clipped. This makes it easier
    // for us to create degenerate lines.
    //float z = step(32767.0, a_pos.x);
    gl_Position = u_posmatrix * vec4(a_pos, u_z, 1);
    gl_Position.z = (1.0 + step(32767.0, a_pos.x)) * gl_Position.w;
    v_pos = (gl_Position.xy/gl_Position.w + 1.0) / 2.0 * u_world;
}
