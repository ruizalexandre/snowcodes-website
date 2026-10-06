// ══════════════════════════════════════════
//  Showreel — 15 s, computed live, no video.
//  WebGL2 draws light, fluid and 3D; a 2D canvas draws type and particles and is uploaded
//  every frame as a texture whose R/G/B channels are three mask layers. Every frame is a pure
//  function of t, so the reel scrubs, and its last frame (the logo collapsing into one orange
//  pixel) is its first.
// ══════════════════════════════════════════
(function () {
    var root = document.getElementById('showreel');
    if (!root) return;
    var frame = root.querySelector('.reel-frame'), cv = frame.querySelector('canvas');
    var range = root.querySelector('input'), btn = root.querySelector('.reel-play');
    var tcEl = root.querySelector('.reel-tc'), list = root.querySelector('.reel-chapters');
    var NAMES = list.dataset.names.split('|');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var AI = document.documentElement.lang === 'fr' ? 'IA.' : 'AI.';

    var START = [0, 2, 4.5, 6.5, 9, 11.5, 13.25], END = 15, POSTER = 14.2;
    var VW = 1920, VH = 1080, S0 = 44, PI = Math.PI;              // virtual frame; S0 = the pixel the reel starts and ends on
    var RED = '#f00', GRN = '#0f0', BLU = '#00f';                 // R: type (white, ink on orange) · G: white · B: orange
    var FONT = 'px Inter, "Helvetica Neue", Arial, sans-serif';

    var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var lerp = function (a, b, k) { return a + (b - a) * k; };
    var eout = function (v) { return 1 - Math.pow(1 - clamp01(v), 4); };
    var ein = function (v) { return Math.pow(clamp01(v), 4); };
    var eio = function (v) { v = clamp01(v); return v < .5 ? 16 * v * v * v * v * v : 1 - Math.pow(2 - 2 * v, 5) / 2; };
    var back = function (v) { v = clamp01(v) - 1; return 1 + 2.70158 * v * v * v + 1.70158 * v * v; };
    var hash = function (n) { n = Math.sin(n * 12.9898) * 43758.5453; return n - Math.floor(n); };

    var tc = document.createElement('canvas'), c = tc.getContext('2d');
    function font(px, weight, g) {
        g = g || c;
        g.font = (weight || 600) + ' ' + px + FONT;
        g.letterSpacing = (weight ? 0 : -.03 * px) + 'px';
    }

    // ══════════ Shader ══════════
    var VS = '#version 300 es\nvoid main(){vec2 p=vec2(gl_VertexID&1,gl_VertexID>>1)*4.-1.;gl_Position=vec4(p,0.,1.);}';
    var FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uT, uL, uBoxR, uBlur, uGlitch, uSweep;
uniform int uShot;
uniform sampler2D uTex;
uniform vec4 uBox;
uniform mat3 uH;
uniform vec3 uFlash;
out vec4 o;

const vec3 OR = vec3(1., .101, 0.), OR2 = vec3(1., .259, .043), PEACH = vec3(1., .782, .646), INK = vec3(.005, .0066, .0103), DARK = vec3(.012, .004, .002);

float sat(float x) { return clamp(x, 0., 1.); }
float eio(float x) { x = sat(x); return x < .5 ? 16. * x * x * x * x * x : 1. - pow(2. - 2. * x, 5.) / 2.; }
float ein(float x) { x = sat(x); return x * x * x * x; }
float eout(float x) { x = 1. - sat(x); return 1. - x * x * x * x; }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h31(vec3 p) { return h21(p.xy + p.z * 17.13); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f *= f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
    float s = 0., a = .5;
    for (int i = 0; i < 4; i++) { s += a * noise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= .5; }
    return s;
}

// ── Flat graphics (type, the orange box, bars, pixels): figure/ground swap inside orange ──
float boxSd(vec2 p) {
    vec2 d = abs(p - uBox.xy) - uBox.zw + uBoxR;
    return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - uBoxR;
}
vec3 flatShot(vec2 p, vec2 uv) {
    float rnd = h21(vec2(floor(uv.y * 18.), floor(uT * 40.)));
    vec2 u = uv + vec2((rnd - .5) * .14 * uGlitch * step(.55, rnd), 0.);
    float ca = .0012 + .012 * uGlitch;
    vec3 T = texture(uTex, u).rgb;
    vec3 cov = vec3(texture(uTex, u + vec2(ca, 0.)).r, T.r, texture(uTex, u - vec2(ca, 0.)).r);
    float bd = uBox.z > 0. ? boxSd(p) : 1.;
    float shape = max(T.b, 1. - smoothstep(-1.5, 1.5, bd * uRes.y));
    vec3 col = OR * shape;
    col += vec3(1., .75, .55) * .5 * exp(-pow((p.x + p.y * .45 - uSweep) * 6., 2.)) * shape;
    float halo = .6 * exp(-max(bd, 0.) * 30.) + textureLod(uTex, uv, 4.).b * .5 + textureLod(uTex, uv, 6.).b * .4;
    col += OR * halo * .4 * (1. - shape);
    col = mix(col, mix(vec3(1.), INK, shape), cov);
    return mix(col, vec3(1.), T.g);
}

// ── Liquid: domain-warped noise, lit through its own screen-space slope ──
float fluidH(vec2 p, float t) {
    vec2 q = vec2(fbm(p + vec2(0., t * .3)), fbm(p + vec2(5.2, 1.3) - t * .25));
    vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * .55), fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * .45));
    return fbm(p + 3.2 * r);
}
vec3 ramp(float v) {
    vec3 c = mix(DARK, OR * .45, smoothstep(.0, .3, v));
    c = mix(c, OR, smoothstep(.25, .55, v));
    c = mix(c, OR2, smoothstep(.6, .85, v));
    return mix(c, PEACH, smoothstep(.85, 1., v));
}
vec3 fluid(vec2 p, float t, float inv) {
    float h = fluidH(p, t);
    vec3 n = normalize(vec3(-vec2(dFdx(h), dFdy(h)) * uRes.y * .045, 1.));
    float v = mix(smoothstep(.3, .72, h), 1. - smoothstep(.25, .7, h), inv);
    vec3 L = normalize(vec3(-.5, .55, .7)), R = reflect(vec3(0., 0., -1.), n);
    float spec = pow(sat(dot(R, L)), 50.), env = smoothstep(.2, .6, R.y) * .3 + smoothstep(.3, .7, -R.x) * .12;
    return ramp(v) * (.5 + .6 * sat(dot(n, L))) + (spec * 1.4 + env * (.08 + .92 * v)) * vec3(1., .85, .7);
}

// ── 02 Kinetic: a type drum on a tilting plane, then it melts ──
vec3 shot2(vec2 p, float s) {
    vec3 q = uH * vec3(p, 1.);
    vec2 X = q.xy / q.z;
    float melt = sat((s - 1.45) / 1.05);
    X += (vec2(fbm(X * 2.5 + s), fbm(X * 2.5 + 7.3 - s)) - .45) * melt * .25;
    vec2 tuv = vec2(X.x * uRes.y / uRes.x + .5, X.y + .5);
    float ty = 0.;
    for (int i = 0; i < 10; i++) ty += texture(uTex, tuv + vec2(0., uBlur * (float(i) / 9. - .5))).r;
    ty = ty / 10. * step(0., q.z);
    vec3 col = mix(OR, INK, ty);
    if (melt > 0.) {
        float th = mix(2.6, -.9, melt * melt * (3. - 2. * melt)), b = textureLod(uTex, tuv, 5.).r * 2.6 + fbm(p * 3. + s * .4) - length(p) * .8;
        float m = smoothstep(th, th + .07, b);
        col = mix(col, fluid(p * 1.3, 0., 0.) * .8, m) + PEACH * m * (1. - m) * 1.6;
    }
    return col;
}

// ── 03 Fluid: liquid seen through liquid letters, a dive into the i, then a vortex closes ──
vec3 shot3(vec2 p, vec2 uv, float u) {
    float vk = ein((u - 1.4) / .6), r = length(p);
    vec2 q = rot(u * .15 + vk * 4. / (r * 3. + .2)) * p * (1. + vk * 1.5) + vec2(u * .1, -u * .05);
    float m = texture(uTex, uv).r;
    vec3 col = mix(fluid(q * 1.3, u, 0.) * .8, fluid(q * 2.1 + vec2(4.1, 2.3), u * 1.4, 1.) * 1.1, m);
    col += PEACH * m * (1. - m) * 1.6;
    float R = mix(1.1, 0., eio((u - 1.45) / .55)), k = step(1.4, u);
    col *= mix(1., smoothstep(R + .004, R - .004, r), k);
    return col + OR2 * exp(-abs(r - R) * 70.) * k * 1.5;
}

// ── 04 3D: one cube, 27 cubes, a lattice to fly through ──
float gSp, gB, gR, gL, gV, gWob;
float sdRB(vec3 p, float b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
float cellK(vec3 id) {
    float m = max(abs(id.x), max(abs(id.y), abs(id.z)));
    float g = m < 1.5 ? 1. : eout((gV - 1.45 - (m - 2.) * .07) / .3);
    return g * (1. - ein((gV - 1.9 - h31(id) * .3) / .45));
}
float map(vec3 p, out vec3 id) {
    vec3 iu = floor(p / gSp + .5);
    id = clamp(iu, -gL, gL);
    vec3 q = p - id * gSp, r = q;
    float k = cellK(id), a = gWob * sin(gV * 5. - dot(id, vec3(.9, .6, .4)));
    r.xz *= rot(a); r.xy *= rot(a * .7);
    float d = k < .02 ? 1e3 : sdRB(r, gB * k, gR * k);
    // never step past the cell wall: the neighbour's cube may be closer than ours
    if (iu == id) d = min(d, max(gSp * .5 - max(abs(q.x), max(abs(q.y), abs(q.z))), 0.) + .02 + max(0., gSp * .5 - gB * 1.74));
    else if (k < .02) d = max(max(abs(p.x), max(abs(p.y), abs(p.z))) - (gL + .5) * gSp, .02);
    return d;
}
vec3 nrm(vec3 p) {
    vec3 id; vec2 e = vec2(.0015, -.0015);
    return normalize(e.xyy * map(p + e.xyy, id) + e.yyx * map(p + e.yyx, id) + e.yxy * map(p + e.yxy, id) + e.xxx * map(p + e.xxx, id));
}
float occl(vec3 p, vec3 n) {
    vec3 id; float o = 0., s = 1.;
    for (int i = 1; i <= 4; i++) { float h = .05 * float(i); o += (h - map(p + n * h, id)) * s; s *= .7; }
    return sat(1. - 2.2 * o);
}
vec3 env(vec3 r) {   // studio softboxes, in camera space
    float top = smoothstep(.55, .8, r.y) * smoothstep(.95, .2, abs(r.x));
    float side = smoothstep(.65, .9, r.x) * smoothstep(.7, .2, abs(r.y));
    float fill = smoothstep(.7, .95, -r.x) * smoothstep(.7, .2, abs(r.y));
    return vec3(1., .95, .9) * (top * 3. + side * 1.6) + OR2 * fill * .8 + vec3(.03) * (.5 + .5 * r.y);
}
vec3 shot4(vec2 p, float v) {
    gV = v;
    float grow = eout(v / .55), split = eio((v - .75) / .55), groove = sat((v - .5) / .25);
    if (v < .55) { gL = 0.; gSp = 4.; gB = grow; gR = .07 * grow; }
    else { gL = v < 1.4 ? 1. : 6.; gSp = mix(2. / 3., 1.2, split); gB = mix(1. / 3. - .012 * groove, .32, split) - .14 * eio((v - 1.4) / .6); gR = mix(.02, .06, split); }
    gWob = .7 * sat((v - 1.3) / .5);

    // spin settles into an isometric view, swings face-on into a corridor, then flies
    float sp = 1. - pow(1. - sat(v / .95), 3.), sw = eio((v - 1.05) / .5);
    float a = mix(mix(-2.4, .785, sp), 0., sw), b = mix(mix(1.1, .615, sp), 0., sw);
    vec3 f = vec3(sin(a) * cos(b), -sin(b), cos(a) * cos(b));
    vec3 tg = vec3(vec2(gSp * .5 * sw), 0.) + f * 9. * pow(sat((v - 1.45) / 1.05), 2.);
    vec3 ro = tg - f * mix(9., 7.5, eout(v / 1.2));
    vec3 rt = normalize(cross(vec3(0., 1., 0.), f)), up = cross(f, rt);
    vec2 pr = rot(.4 * eio((v - 1.5) / 1.)) * p;
    vec3 rd = normalize(f * 1.5 + pr.x * rt + pr.y * up);

    float tt = 0., glow = 0.; vec3 id; bool hit = false;
    for (int i = 0; i < 120; i++) {
        float d = map(ro + rd * tt, id);
        glow += exp(-d * 30.);
        if (d < .0008 * tt) { hit = true; break; }
        tt += d * .85;
        if (tt > 30.) break;
    }
    vec3 bg = OR * .012 * exp(-dot(p, p) * 4.), col = bg;
    if (hit) {
        vec3 pp = ro + rd * tt, n = nrm(pp), r = reflect(rd, n);
        float hs = h31(id), occ = occl(pp, n), ndv = sat(dot(n, -rd)), fre = pow(1. - ndv, 5.);
        vec3 alb = hs < .7 ? OR : hs < .86 ? vec3(.8, .78, .76) : vec3(.015);
        vec3 L1 = normalize(-rt * .55 + up * .75 - f * .35);
        float dif = sat(dot(n, L1)), spec = pow(sat(dot(n, normalize(L1 - rd))), 90.);
        vec3 fill = OR2 * (.5 * sat(dot(n, rt)) + .3 * sat(-dot(n, up))) * .3;
        col = alb * (dif * 1.6 + fill + .025) * occ;
        col += (spec * 3. + env(vec3(dot(r, rt), dot(r, up), dot(r, f))) * mix(.04, 1., fre)) * occ;
        col += OR * .6 * pow(1. - ndv, 4.) * (hs < .86 ? 1. : .4);
    }
    col += OR2 * glow * .02 * sat((v - 1.9) / .4);
    col = mix(col, bg, 1. - exp(-tt * tt * .01));
    float mx = max(col.r, max(col.g, col.b));                     // hue-preserving shoulder: the orange stays the brand orange
    if (mx > .8) col *= (.8 + .2 * (1. - exp(5. * (.8 - mx)))) / mx;
    return col + OR2 * exp(-length(p) * 30.) * (1. - sat(v / .25)) * 2.;
}

// ── 05 Particles: snow with depth of field and a little chromatic fringe ──
vec3 shot5(vec2 p, vec2 uv, float w) {
    vec3 T = texture(uTex, uv).rgb;
    vec2 d = (uv - .5) * .008;
    vec3 white = vec3(texture(uTex, uv + d).g, T.g, texture(uTex, uv - d).g);
    vec3 b1 = textureLod(uTex, uv, 3.).rgb, b2 = textureLod(uTex, uv, 5.).rgb;
    float form = eout((w - .8) / .8) * (1. - eio((w - 2.) / .4));
    vec3 col = OR * .025 * fbm(p * 2. + vec2(w * .15, 0.)) + OR * .06 * exp(-length(p) * 3.) * form;
    col += white + OR * T.b;
    return col + (vec3(1., .85, .75) * b1.g + OR * b1.b) * .22 + (vec3(1., .6, .4) * b2.g + OR * b2.b) * .25;
}

void main() {
    vec2 fc = gl_FragCoord.xy, uv = fc / uRes, p = (fc - .5 * uRes) / uRes.y;
    vec3 col;
    if (uShot == 1) col = shot2(p, uL);
    else if (uShot == 2) col = shot3(p, uv, uL);
    else if (uShot == 3) col = shot4(p, uL);
    else if (uShot == 4) col = shot5(p, uv, uL);
    else col = flatShot(p, uv);
    if (uShot > 0 && uShot < 4) col = mix(col, vec3(1.), texture(uTex, uv).g);
    col *= 1. - .28 * dot(p, p);
    col = pow(max(col, 0.), vec3(1. / 2.2)) + uFlash;               // flashes decay in display space: no lingering grey
    o = vec4(col + (h21(fc + fract(uT * 7.31) * 113.) - .5) * .045, 1.);
}`;

    // ══════════ Per-frame uniforms, set by the shots ══════════
    var I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1], U;
    function resetU() { U = { box: [0, 0, 0, 0], r: 0, h: I3, blur: 0, glitch: 0, flash: [0, 0, 0], sweep: -9 }; }
    function setBox(cx, cy, hw, hh, r) {
        U.box = [(cx - 960) / VH, (540 - cy) / VH, hw / VH, hh / VH]; U.r = r / VH;
        c.globalAlpha = 1; c.fillStyle = BLU; c.beginPath(); c.roundRect(cx - hw, cy - hh, hw * 2, hh * 2, r); c.fill();
    }
    function flash(a, warm) { U.flash = [a, a * (warm ? .55 : .9), a * (warm ? .3 : .85)]; }

    // Plane seen by a pinhole camera: maps screen (p-space) back to plane coordinates.
    function planeH(yaw, pitch, roll, zoom) {
        var f = 1.6, D = f / zoom, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
        var a = f * cr * cy, b = f * (cr * sy * sp - sr * cp), d = f * sr * cy, e = f * (sr * sy * sp + cr * cp), g = -sy, h = cy * sp;
        // inverse of [[a, b, 0], [d, e, 0], [g, h, D]], column-major for GLSL
        var det = D * (a * e - b * d);
        return [e * D / det, -d * D / det, (d * h - e * g) / det, -b * D / det, a * D / det, (b * g - a * h) / det, 0, 0, (a * e - b * d) / det];
    }

    // ══════════ 01 Typography: one pixel becomes a cursor, types, and floods the frame ══════════
    function shot1(t) {
        var F = 230, cap = F * .727, base = 540 + cap / 2, word = 'Code.', k;
        font(F);
        var tw = 0, xs = [], cw = [], prev = 0;
        for (k = 0; k < 5; k++) {
            var wk = c.measureText(word.slice(0, k + 1)).width;
            cw[k] = wk - prev; prev = wk;
            xs[k] = tw; tw += cw[k] * eout((t - .42 - k * .1) / .09);
        }
        var side = lerp(S0, cap, eout((t - .2) / .26)) * (1 + .35 * Math.sin(PI * clamp01(t / .2)));
        var gap = .09 * F * clamp01(tw / cw[0]);
        var ex = eio((t - 1.25) / .7), ey = eio((t - 1.31) / .69);
        var x0 = lerp(960 - (tw + gap + side) / 2, 960 - tw / 2, ex);
        if (t < 1.02 || t > 1.12) setBox(lerp(x0 + tw + gap + side / 2, 960, ex), 540, lerp(side / 2, 990, ex), lerp(side / 2, 570, ey), lerp(side * .12, 0, ex));

        c.strokeStyle = GRN; c.lineWidth = 1.6;
        if (t < .62) {
            c.globalAlpha = .55 * (1 - clamp01((t - .02) / .6));
            c.beginPath(); c.arc(960, 540, S0 / 2 + 460 * eout((t - .02) / .6), 0, 2 * PI); c.stroke();
        }
        for (var j = -2; j <= 2 && t > .95; j++) if (j) {              // outlined echoes slide in
            var eo = t - .95, dir = j & 1 ? 1 : -1;
            c.globalAlpha = .4 / Math.abs(j) * eout(eo / .3);
            c.strokeText(word, x0 + dir * ((1 - eout((eo - .05 * Math.abs(j)) / .5)) * 700 + eo * 90), base + j * F * 1.08);
        }
        c.fillStyle = RED;
        for (k = 0; k < 5; k++) {
            var a = t - .42 - k * .1, s = 1 + .3 * (1 - eout(a / .25));
            if (a <= 0) continue;
            c.globalAlpha = clamp01(a / .04);
            c.save(); c.translate(x0 + xs[k] + cw[k] / 2, base); c.scale(s, s); c.fillText(word[k], -cw[k] / 2, 0); c.restore();
        }
    }

    // ══════════ 02 Kinetic: Code → Create → Explore on a drum, spinning out on a tilting plane ══════════
    var WORDS = ['Code.', 'Create.', 'Explore.'];
    function drumPhi(s) { var st = PI / 6; return st * (back((s - .04) / .36) + back((s - .54) / .36)) + 4 * PI * Math.pow(clamp01((s - 1) / 1.5), 2); }
    function shot2(s) {
        var F = 230, cap = F * .727, R = F * 1.9, FP = 1700, st = PI / 6, phi = drumPhi(s);
        font(F); c.textAlign = 'center'; c.fillStyle = RED;
        var k0 = Math.round(phi / st), fade = eout(s / .3);
        for (var k = k0 - 3; k <= k0 + 3; k++) {
            var th = k * st - phi, co = Math.cos(th);
            if (co < .03) continue;
            var sc = FP / (FP + R * (1 - co));
            c.globalAlpha = (.1 + .9 * Math.pow(co, 4)) * (k ? fade : 1);
            c.save(); c.translate(960, 540 + R * Math.sin(th) * sc); c.scale(sc, sc * co);
            c.fillText(WORDS[(k % 3 + 3) % 3], 0, cap / 2); c.restore();
        }
        U.blur = R * (drumPhi(s + .004) - drumPhi(s - .004)) / .008 / 45 / VH;
        var e = eio((s - .9) / 1.1);
        U.h = planeH(-.55 * e, .3 * e, -.12 * e, 1 - .35 * e);
    }

    // ══════════ 03 Fluid: the letters are windows; the camera dives through the i ══════════
    function shot3(u) {
        var word = 'Motion.';
        font(100);
        var F = 100 * 1560 / c.measureText(word).width, cap = F * .727, base = 540 + cap / 2;
        font(F); c.fillStyle = RED;
        var x0 = 960 - c.measureText(word).width / 2;
        var fx = x0 + c.measureText('Mot').width + (c.measureText('i').width + .03 * F) / 2, fy = base - .27 * F;
        var e = eio((u - 1.1) / .5), z = Math.exp(Math.log(90) * ein((u - 1.1) / .5));
        if (z > 80) { c.fillRect(0, 0, VW, VH); return; }
        c.save();
        c.translate(lerp(fx, 960, e), lerp(fy, 540, e)); c.scale(z, z); c.translate(-fx, -fy);
        for (var k = 0, x = x0; k < word.length; k++) {
            var cw = c.measureText(word[k]).width, r = eout((u - .1 - k * .045) / .4);
            if (r > 0) {
                c.save(); c.beginPath(); c.rect(x - 40, base - cap - 60, cw + 80, cap + 60 + .1 * F); c.clip();
                c.fillText(word[k], x, base + (1 - r) * (cap + .25 * F)); c.restore();
            }
            x += cw;
        }
        c.restore();
    }

    // ══════════ 04 3D: all in the shader ══════════
    function shot4(v) { if (v > 2.25) flash(ein((v - 2.25) / .25) * 1.2); }

    // ══════════ 05 Particles: snow, a flake, a burst ══════════
    var NP = 0, NF = 0, P;
    function initParticles() {
        var segs = [], pts = [];
        for (var k = 0; k < 6; k++) {
            var ca = Math.cos(k * PI / 3), sa = Math.sin(k * PI / 3);
            var seg = function (x0, y0, x1, y1) { segs.push([x0 * ca - y0 * sa, x0 * sa + y0 * ca, x1 * ca - y1 * sa, x1 * sa + y1 * ca]); };
            seg(.1, 0, 1, 0);
            [[.32, .26], [.56, .2], [.76, .13]].forEach(function (b) { seg(b[0], 0, b[0] + b[1] * .5, b[1] * .866); seg(b[0], 0, b[0] + b[1] * .5, -b[1] * .866); });
            seg(.2, 0, .1, .1732);
        }
        segs.forEach(function (s) {
            for (var i = 0, n = Math.max(2, Math.round(Math.hypot(s[2] - s[0], s[3] - s[1]) / .011)); i <= n; i++)
                pts.push(lerp(s[0], s[2], i / n) + (Math.random() - .5) * .008, lerp(s[1], s[3], i / n) + (Math.random() - .5) * .008);
        });
        NF = pts.length / 2; NP = NF + 900;
        P = { r: [], a: [], z: [], s: [], o: [], fx: [], fy: [], fz: [], d: [] };
        for (var i = 0; i < NP; i++) {
            P.r[i] = .15 + Math.pow(Math.random(), .7) * 3.4; P.a[i] = Math.random() * 2 * PI; P.z[i] = Math.random() * 24;
            P.s[i] = .6 + Math.random() * .9; P.o[i] = Math.random() < .22; P.d[i] = Math.random();
            if (i < NF) { P.fx[i] = pts[2 * i]; P.fy[i] = pts[2 * i + 1]; P.fz[i] = (Math.random() - .5) * .05; }
        }
    }
    function ppos(i, w, out) {
        var camZ = 15 * (1 - Math.pow(1 - clamp01(w / 1.1), 3));
        var r = P.r[i], a = P.a[i] + w * (.25 + .45 / (r + .35));
        var x = r * Math.cos(a), y = r * Math.sin(a) * .85 - w * .25 * P.s[i], z = ((P.z[i] - camZ) % 24 + 24) % 24 + .35;
        if (i < NF) {
            var k = eio((w - .7 - P.d[i] * .45) / .6);
            if (k > 0) {
                var cs = Math.cos(w * .5), sn = Math.sin(w * .5), ya = .6 * Math.sin(w * 1.7 - .8), cy = Math.cos(ya), sy = Math.sin(ya);
                var fx = P.fx[i] * 1.6, fy = P.fy[i] * 1.6, X = fx * cs - fy * sn, Y = fx * sn + fy * cs;
                var Z = -X * sy + P.fz[i] * cy, b = ein((w - 1.95 - P.d[i] * .15) / .5);
                X = (X * cy + P.fz[i] * sy) * (1 + b * 1.4); Y *= 1 + b * 1.4; Z += 4.2 - b * 3.8 * (.6 + P.s[i] * .25);
                x = lerp(x, X, k); y = lerp(y, Y, k); z = lerp(z, Z, k);
            }
        }
        out[0] = x; out[1] = y; out[2] = z;
    }
    function capsule(p, x0, y0, x1, y1, r) {                       // a disc smeared along its motion
        var dx = x1 - x0, dy = y1 - y0;
        if (dx * dx + dy * dy < .25) { p.moveTo(x1 + r, y1); p.arc(x1, y1, r, 0, 2 * PI); return; }
        var a = Math.atan2(dy, dx);
        p.moveTo(x1 + r * Math.sin(a), y1 - r * Math.cos(a));
        p.arc(x1, y1, r, a - PI / 2, a + PI / 2);
        p.arc(x0, y0, r, a + PI / 2, a + 3 * PI / 2);
        p.closePath();
    }
    var LEVELS = [.01, .03, .07, .15, .3, 1], cur = [0, 0, 0], prv = [0, 0, 0];
    function shot5(w) {
        var paths = [], b, Fv = 900;
        for (b = 0; b < 12; b++) paths[b] = new Path2D();
        for (var i = 0; i < NP; i++) {
            ppos(i, w, cur); ppos(i, w - 1 / 40, prv);
            if (cur[2] < .3) continue;
            if (prv[2] < .3 || Math.abs(cur[2] - prv[2]) > 5) { prv[0] = cur[0]; prv[1] = cur[1]; prv[2] = cur[2]; }
            var x1 = 960 + cur[0] / cur[2] * Fv, y1 = 540 - cur[1] / cur[2] * Fv, x0 = 960 + prv[0] / prv[2] * Fv, y0 = 540 - prv[1] / prv[2] * Fv;
            var base = P.s[i] * 10 / cur[2], r = Math.min(64, Math.max(base, .085 * Math.abs(1 / cur[2] - 1 / 4.2) * Fv));
            var al = Math.min(1, base * base / (r * r)) * 2 * r / (2 * r + Math.hypot(x1 - x0, y1 - y0));
            if (al < .008) continue;
            for (b = 0; b < 5 && al > (LEVELS[b] + LEVELS[b + 1]) / 2; b++);
            capsule(paths[(P.o[i] ? 6 : 0) + b], x0, y0, x1, y1, r);
        }
        for (b = 0; b < 12; b++) { c.globalAlpha = LEVELS[b % 6]; c.fillStyle = b < 6 ? GRN : BLU; c.fill(paths[b]); }
        flash(1.2 * Math.exp(-w * 10) + .9 * ein((w - 2.25) / .25));
    }

    // ══════════ 06 Cuts: one beat, one word, one technique ══════════
    var CUTS = [0, .375, .75, 1.125, 1.4375, 1.75], AIC = [], MS = [];
    function shot6(m) {
        var k = 0;
        while (m >= CUTS[k + 1]) k++;
        var lt = m - CUTS[k];
        U.glitch = Math.exp(-lt * 22);
        if (!k) flash(.9 * Math.exp(-lt * 30));
        c.textAlign = 'center';
        [cutWeb, cutMobile, cutAI, cutEvery, cutMatters][k](lt);
    }
    function cutWeb(lt) {                                          // bars thinning out, as on the full logo
        var F = 440, cap = F * .727, y = 540 - cap * .52;
        c.fillStyle = BLU;
        [.26, .18, .13, .09, .06, .04].forEach(function (h, i) { c.fillRect(0, y, VW * eio((lt - i * .025) / .2), h * cap); y += h * cap + .048 * cap; });
        font(F); c.fillStyle = RED;
        c.fillText('Web.', 960 + 220 * (1 - eout(lt / .3)), 540 + cap / 2);
    }
    function cutMobile(lt) {
        var s = lerp(.55, 1, eout(lt / .25)), F = 300;
        c.save(); c.translate(960, 540); c.rotate((1 - back(lt / .3)) * -PI / 2); c.scale(s, s);
        c.fillStyle = BLU; c.beginPath(); c.roundRect(-235, -440, 470, 880, 72); c.fill();
        c.restore();
        font(F); c.fillStyle = RED; c.fillText('Mobile.', 960, 540 + F * .3635);
    }
    function cutAI(lt) {                                           // the full logo's pixel grid
        var S = 40, i, fr = Math.floor(lt * 24);
        c.fillStyle = GRN; c.globalAlpha = .1;
        for (i = 0; i <= VW; i += S) c.fillRect(i, 0, 1.5, VH);
        for (i = 0; i <= VH; i += S) c.fillRect(0, i, VW, 1.5);
        c.globalAlpha = .14;
        for (i = 0; i < 60; i++) c.fillRect(Math.floor(hash(i * 3.3 + fr) * 48) * S + 2, Math.floor(hash(i * 5.7 + fr * 2) * 27) * S + 2, S - 3, S - 3);
        c.globalAlpha = 1; c.fillStyle = BLU;
        for (i = 0; i < AIC.length; i += 3) if (lt > AIC[i + 2]) c.fillRect(AIC[i] - S / 2 + 2, AIC[i + 1] - S / 2 + 2, S - 3, S - 3);
    }
    function cutEvery(lt) {                                        // slit-scan
        var F = 250, base = 540 + F * .3635, amp = 180 * (1 - eout(lt / .26)), n = 16, top = 540 - F * .45, hh = F * 1.07 / n;
        font(F); c.fillStyle = RED;
        for (var j = 0; j < n; j++) {
            c.save(); c.beginPath(); c.rect(0, top + j * hh, VW, hh + .5); c.clip();
            c.fillText('Everything', 960 + amp * Math.sin(j * 1.9 + lt * 40), base); c.restore();
        }
    }
    function cutMatters(lt) {
        var F = 300, s = 1 + .3 * (1 - eout(lt / .22));
        font(F); c.fillStyle = BLU;
        c.save(); c.translate(960, 540); c.scale(s, s); c.fillText('matters.', 0, F * .3635); c.restore();
    }

    // ══════════ 07 Logo: pixels land, bars build the block, figure and ground swap, it all folds into one pixel ══════════
    var BW = 1100, BH = BW * 530 / 1200, BX = 960 - BW / 2, BY = 500 - BH / 2, BARS = [], MASK, LC = [];
    [.24, .18, .145, .115, .09, .075, .065, .05, .04].reduce(function (y, h) { BARS.push([y, h * BH]); return y + h * BH; }, BY);
    function barRight(i, L) { return BX + BW * eio((L - .08 - i * .028) / .36); }
    function shot7(L) {
        var i, j;
        if (L < .8) {
            c.fillStyle = BLU;
            BARS.forEach(function (b, i) { var r = barRight(i, L); if (r > BX) c.fillRect(BX, b[0], r - BX, b[1] + .6); });
        }
        var crisp = clamp01((L - .7) / .1);
        if (crisp < 1) {
            var pr = new Path2D(), pb = new Path2D();
            for (i = 0; i < LC.length; i += 7) {
                var k = eio((L - LC[i + 6]) / .34), u1 = 1 - k, sz = lerp(7, 9.5, k);
                var x = u1 * u1 * LC[i] + 2 * u1 * k * LC[i + 2] + k * k * LC[i + 4], y = u1 * u1 * LC[i + 1] + 2 * u1 * k * LC[i + 3] + k * k * LC[i + 5];
                for (j = 0; j < BARS.length && !(y >= BARS[j][0] && y < BARS[j][0] + BARS[j][1]); j++);
                (j < BARS.length && x < barRight(j, L) ? pr : pb).rect(x - sz / 2, y - sz / 2, sz, sz);
            }
            c.globalAlpha = 1 - crisp; c.fillStyle = RED; c.fill(pr); c.fillStyle = BLU; c.fill(pb);
        }
        var e1 = eio((L - 1.2) / .55), e2 = eio((L - 1.15) / .6);
        var cy = lerp(500, 540, e2), hw = lerp(BW / 2, S0 / 2, e1), hh = lerp(BH / 2, S0 / 2, e2);
        if (L >= .8) setBox(960, cy, hw, hh, lerp(0, S0 * .12, e1));
        if (crisp > 0 && MASK) {
            var sl = hh / (BH / 2);
            c.save(); c.beginPath(); c.rect(960 - hw, cy - hh, hw * 2, hh * 2); c.clip();
            c.globalAlpha = crisp * (1 - eout((L - 1.4) / .25));
            c.translate(960, cy); c.scale(sl, sl); c.drawImage(MASK, -BW / 2, -BH / 2, BW, BH);
            c.restore();
        }
        var ca = eout((L - .8) / .3) * (1 - clamp01((L - 1.2) / .12));
        if (ca > 0) {
            font(30, 500); c.letterSpacing = lerp(30, 11, eout((L - .8) / .45)) + 'px';
            c.textAlign = 'center'; c.fillStyle = GRN; c.globalAlpha = ca * .85;
            c.fillText('CODE · CREATE · EXPLORE', 960, BY + BH + 92);
        }
        U.sweep = lerp(-1.4, 1.4, eio((L - .8) / .45));
        flash(.3 * Math.exp(-L * 30), true);
    }

    // ══════════ HUD ══════════
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function hud(t, si) {
        var f = Math.floor(t * 24), m = 44, l = 22;
        c.globalAlpha = .5; c.fillStyle = GRN;
        font(17, 500); c.letterSpacing = '3px';
        c.textAlign = 'left';
        c.fillText('SNOWCODES — SHOWREEL', 70, 88);
        c.fillText(NAMES[si].toUpperCase(), 70, VH - 70);
        c.textAlign = 'right';
        c.fillText('0' + (si + 1) + ' / 07', VW - 70, 88);
        c.fillText('00:' + pad(Math.floor(f / 24)) + ':' + pad(f % 24), VW - 70, VH - 70);
        [[m, m, 1, 1], [VW - m, m, -1, 1], [m, VH - m, 1, -1], [VW - m, VH - m, -1, -1]].forEach(function (k) {
            c.fillRect(k[0], k[1], l * k[2], 2 * k[3]); c.fillRect(k[0], k[1], 2 * k[2], l * k[3]);
        });
    }

    // ══════════ One-time sampling: shapes the particles land on ══════════
    function sample(draw, step) {                                  // grid points inside a drawing, in virtual px
        var s = document.createElement('canvas'), g = s.getContext('2d', { willReadFrequently: true }), out = [];
        s.width = VW / 2; s.height = VH / 2; g.scale(.5, .5); g.textAlign = 'center'; draw(g);
        var d = g.getImageData(0, 0, s.width, s.height).data;
        for (var y = step / 2; y < VH; y += step) for (var x = step / 2; x < VW; x += step)
            if (d[((y / 2 | 0) * s.width + (x / 2 | 0)) * 4 + 3] > 128) out.push(x, y);
        return out;
    }
    function initShapes(logo) {
        var i, pts = sample(function (g) { font(560, 0, g); g.fillText(AI, 960, 540 + 560 * .3635); }, 40);
        for (i = 0; i < pts.length; i += 2) AIC.push(pts[i], pts[i + 1], Math.random() * .16);
        MS = sample(function (g) { font(300, 0, g); g.fillText('matters.', 960, 540 + 300 * .3635); }, 9);
        if (!logo.naturalWidth) return;
        // Logo letters are cut-outs in the orange block: keep them, inside a safe inset.
        MASK = document.createElement('canvas'); MASK.width = 1200; MASK.height = 530;
        var mx = MASK.getContext('2d', { willReadFrequently: true });
        mx.fillStyle = RED; mx.fillRect(36, 26, 1128, 478);
        mx.globalCompositeOperation = 'destination-out'; mx.drawImage(logo, 0, 0, 1200, 530);
        var d = mx.getImageData(0, 0, 1200, 530).data, cells = [];
        for (var y = 6; y < 530; y += 12) for (var x = 6; x < 1200; x += 12)
            if (d[(y * 1200 + x) * 4 + 3] > 128) cells.push([BX + x * BW / 1200, BY + y * BH / 530]);
        // Map left-to-right onto "matters.", so the word streams into the logo instead of scrambling.
        var src = [];
        for (i = 0; i < MS.length; i += 2) src.push([MS[i], MS[i + 1]]);
        src.sort(function (a, b) { return a[0] - b[0]; });
        cells.sort(function (a, b) { return a[0] - b[0]; });
        cells.forEach(function (t, i) {
            var s = src[Math.floor(i * src.length / cells.length)] || [960, 540], dx = t[0] - s[0], dy = t[1] - s[1], o = (Math.random() - .5) * .5;
            LC.push(s[0], s[1], (s[0] + t[0]) / 2 - dy * o, (s[1] + t[1]) / 2 + dx * o, t[0], t[1], (t[0] - BX) / BW * .2 + Math.random() * .06);
        });
    }

    // ══════════ GL ══════════
    var SHOTS = [shot1, shot2, shot3, shot4, shot5, shot6, shot7];
    var gl, loc = {}, W = 0, H = 0, quality = 1, ready = false;
    function setupGL() {
        gl = cv.getContext('webgl2', { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance' });
        if (!gl) return false;
        var prog = gl.createProgram();
        [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]].forEach(function (s) {
            var sh = gl.createShader(s[0]);
            gl.shaderSource(sh, s[1]); gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
            gl.attachShader(prog, sh);
        });
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
        gl.useProgram(prog);
        ['uRes', 'uT', 'uL', 'uShot', 'uBox', 'uBoxR', 'uH', 'uBlur', 'uGlitch', 'uFlash', 'uSweep'].forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        return true;
    }
    function resize() {
        var w = Math.min(1440, Math.round(frame.clientWidth * Math.min(2, devicePixelRatio || 1) * quality));
        if (w < 16 || w === W) return;
        W = cv.width = tc.width = w; H = cv.height = tc.height = Math.round(w * 9 / 16);
        gl.viewport(0, 0, W, H);
        if (!playing) draw(t);
    }

    var t = reduce ? POSTER : 0, si = -1;
    function draw(time) {
        if (!ready || !W) return;
        var s = 6;
        while (time < START[s]) s--;
        c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
        c.setTransform(W / VW, 0, 0, H / VH, 0, 0); c.globalCompositeOperation = 'lighter';
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        resetU();
        SHOTS[s](time - START[s]);
        hud(time, s);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform2f(loc.uRes, W, H);
        gl.uniform1f(loc.uT, time); gl.uniform1f(loc.uL, time - START[s]); gl.uniform1i(loc.uShot, s);
        gl.uniform4fv(loc.uBox, U.box); gl.uniform1f(loc.uBoxR, U.r);
        gl.uniformMatrix3fv(loc.uH, false, U.h);
        gl.uniform1f(loc.uBlur, U.blur); gl.uniform1f(loc.uGlitch, U.glitch);
        gl.uniform3fv(loc.uFlash, U.flash); gl.uniform1f(loc.uSweep, U.sweep);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        range.value = time;
        range.style.setProperty('--p', time / END * 100 + '%');
        tcEl.textContent = '00:' + pad(Math.floor(time)) + ' / 00:' + END;
        if (s !== si) { si = s; [].forEach.call(list.children, function (li, i) { li.classList.toggle('on', i === s); }); }
    }

    // ══════════ Playback ══════════
    var wanted = !reduce, inView = false, playing = false, raf = 0, last = 0, acc = 0, n = 0;
    function loop(now) {
        var dt = Math.min(.1, Math.max(0, now - last) / 1000);        // rAF's timestamp can predate the play() that set last
        last = now;
        t = (t + dt) % END;
        draw(t);
        // ponytail: quality only steps down (never back up) — a slow GPU stays smooth, a fast one never notices
        acc += dt;
        if (++n === 40) { if (acc / n > 1 / 40 && quality > .5) { quality *= .8; resize(); } acc = n = 0; }
        raf = requestAnimationFrame(loop);
    }
    function sync() {
        root.classList.toggle('paused', !wanted);
        btn.setAttribute('aria-label', wanted ? root.dataset.pause : root.dataset.play);
        var p = wanted && inView && ready;
        if (p === playing) return;
        playing = p;
        if (p) { last = performance.now(); acc = n = 0; raf = requestAnimationFrame(loop); }
        else cancelAnimationFrame(raf);
    }
    function toggle() { wanted = !wanted; sync(); }
    function seek(time) { t = Math.min(Math.max(time, 0), END - .001); if (!playing) draw(t); }

    function init() {
        if (!setupGL()) { root.classList.add('reel-off'); return; }
        initShapes(logo);
        initParticles();
        NAMES.forEach(function (name, i) {
            var li = document.createElement('li'), b = document.createElement('button');
            li.style.flexGrow = (START[i + 1] || END) - START[i];
            b.type = 'button'; b.textContent = name;
            b.addEventListener('click', function () { seek(START[i]); });
            li.appendChild(b); list.appendChild(li);
        });
        range.max = END;
        range.addEventListener('input', function () { seek(+range.value); });
        btn.addEventListener('click', toggle);
        frame.addEventListener('click', toggle);
        ready = true;
        resize();
        new ResizeObserver(resize).observe(frame);
        new IntersectionObserver(function (es) { inView = es[0].isIntersecting; sync(); }, { threshold: .25 }).observe(frame);
        sync();
    }

    var logo = new Image();
    logo.src = '/assets/web/logo.png';
    new IntersectionObserver(function (es, io) {                   // compile and sample only when the reel is near
        if (!es[0].isIntersecting) return;
        io.disconnect();
        Promise.race([
            Promise.all([document.fonts.load('600 100px Inter'), document.fonts.load('500 20px Inter'), logo.decode()]),
            new Promise(function (r) { setTimeout(r, 3000); })
        ]).catch(function () {}).then(init);
    }, { rootMargin: '600px' }).observe(root);
})();
