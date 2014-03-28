precision mediump float;

attribute vec2 a_pos;
uniform mat4 u_posmatrix;
uniform float u_z;

void main() {
    gl_Position = u_posmatrix * vec4(a_pos, u_z, 1);
    gl_PointSize = 2.0;
}
