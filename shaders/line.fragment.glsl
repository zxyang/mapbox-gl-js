precision mediump float;

// shared
uniform float u_debug;
uniform vec2 u_linewidth;
uniform vec4 u_color;
uniform float u_gamma;
uniform float u_blur;

uniform vec2 u_dasharray;

varying float v_linesofar;

varying vec2 v_extrude;
varying float v_fadedist;
varying float v_outerdist;

void main() {

    // Calculate the distance of the pixel from the line in pixels.
    //float dist = length(v_normal);
    float dist = length(v_extrude);
    float alpha = clamp((v_outerdist - dist) / v_fadedist / 1.0, 0.0, 1.0);
    alpha = max(alpha, 0.1);

    // Calculate the antialiasing fade factor based on distance to the dash.
    // Only affects alpha when line is dashed
    float pos = mod(v_linesofar, u_dasharray.x + u_dasharray.y);
    alpha *= max(step(0.0, -u_dasharray.y), clamp(min(pos, u_dasharray.x - pos), 0.0, 1.0));

    gl_FragColor = u_color * alpha;

    if (u_debug > 0.0) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
}
