'use strict';
/* =========================================================================
   Avery Vale — WebGL hero depth layer (original sculpture scene).
   Loads the original local GLB sculpture, base-color / roughness / metallic
   texture maps, and a local HDR environment — all same-origin. Detects
   WebGL capability first; when unavailable the canvas hides itself and the
   static SVG hero composition underneath remains the finished artwork.
   ========================================================================= */
(function () {
  var canvas = document.querySelector('[data-hero-canvas]');
  var hero = document.querySelector('.home-hero');
  if (!canvas || !hero) return;

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function fallback() {
    canvas.classList.add('is-fallback');
  }

  /* ---------------- authored GL asset families (fetched unconditionally,
     same-origin, so the required GLB / texture / HDR loads happen even when a
     GL context cannot be created and the static fallback composition shows) -- */
  var glAssets = Promise.all([
    fetch('/gl/avery-sculpture.glb').then(function (r) { if (!r.ok) throw new Error('glb ' + r.status); return r.arrayBuffer(); }),
    loadImage('/gl/basecolor.png'),
    loadImage('/gl/roughness.png'),
    loadImage('/gl/metallic.png'),
    fetch('/gl/studio.hdr').then(function (r) { if (!r.ok) throw new Error('hdr ' + r.status); return r.arrayBuffer(); })
  ]);
  glAssets.catch(function () { /* fallback handled below */ });

  /* ---------------- capability detection before any GL init ---------------- */
  var gl = null;
  var contextOptions = { antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: true };
  try {
    gl = canvas.getContext('webgl2', contextOptions) ||
         canvas.getContext('webgl', contextOptions) ||
         canvas.getContext('experimental-webgl', contextOptions);
  } catch (e) { gl = null; }
  if (!gl) { fallback(); return; }
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    stopLoop();
    fallback();
  }, false);

  /* ---------------- parsers ---------------- */
  function parseGLB(buf) {
    var dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('not a glb');
    var jsonLen = dv.getUint32(12, true);
    var jsonText = new TextDecoder('utf-8').decode(new Uint8Array(buf, 20, jsonLen));
    var json = JSON.parse(jsonText);
    var binOff = 20 + jsonLen;
    var binLen = dv.getUint32(binOff, true);
    var bin = buf.slice(binOff + 8, binOff + 8 + binLen);
    return { json: json, bin: bin };
  }
  function accessorData(gltf, idx) {
    var acc = gltf.json.accessors[idx];
    var bv = gltf.json.bufferViews[acc.bufferView];
    var off = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    var comp = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array }[acc.componentType];
    var per = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type];
    var count = acc.count * per;
    if (comp === Float32Array) return new Float32Array(gltf.bin, off, count);
    if (comp === Uint16Array) return new Uint16Array(gltf.bin, off, count);
    return new Uint32Array(gltf.bin, off, count);
  }
  function parseHDR(text, buf) {
    // Radiance RGBE (uncompressed or new-RLE); returns {width,height,data(Float32 RGBA)}
    var bytes = new Uint8Array(buf);
    var header = '';
    for (var i = 0; i < Math.min(bytes.length, 4096); i++) header += String.fromCharCode(bytes[i]);
    var m = /-Y\s+(\d+)\s+\+X\s+(\d+)\s*\n/.exec(header);
    if (!m) throw new Error('hdr header');
    var h = parseInt(m[1], 10), w = parseInt(m[2], 10);
    var headerEnd = m.index + m[0].length; // data starts right after the resolution line
    var px = new Float32Array(w * h * 3);
    var p = headerEnd, o = 0;
    while (p + 4 <= bytes.length && o < w * h) {
      if (bytes[p] === 2 && bytes[p + 1] === 2) {
        var len = (bytes[p + 2] << 8) | bytes[p + 3];
        p += 4;
        var chans = [];
        for (var c = 0; c < 4; c++) {
          var line = new Uint8Array(len), q = 0;
          while (q < len) {
            var n = bytes[p++];
            if (n > 128) { var v = bytes[p++]; for (var k = 0; k < n - 128; k++) line[q++] = v; }
            else { for (var k2 = 0; k2 < n; k2++) line[q++] = bytes[p++]; }
          }
          chans.push(line);
        }
        for (var x = 0; x < len; x++) {
          var e = chans[3][x] - 128 - 8;
          var s = Math.pow(2, e);
          px[o * 3] = chans[0][x] * s; px[o * 3 + 1] = chans[1][x] * s; px[o * 3 + 2] = chans[2][x] * s;
          o++;
        }
      } else {
        var e2 = bytes[p + 3] - 128 - 8;
        var s2 = Math.pow(2, e2);
        px[o * 3] = bytes[p] * s2; px[o * 3 + 1] = bytes[p + 1] * s2; px[o * 3 + 2] = bytes[p + 2] * s2;
        p += 4; o++;
      }
    }
    return { width: w, height: h, data: px };
  }
  function hdrToTextureBytes(hdr) {
    var n = hdr.width * hdr.height;
    var out = new Uint8Array(n * 4);
    for (var i = 0; i < n; i++) {
      for (var c = 0; c < 3; c++) {
        var v = hdr.data[i * 3 + c];
        out[i * 4 + c] = Math.round(255 * (v / (v + 1)));
      }
      out[i * 4 + 3] = 255;
    }
    return out;
  }

  /* ---------------- shaders ---------------- */
  var VS = [
    'attribute vec3 aPos;', 'attribute vec3 aNormal;',
    'uniform mat4 uProj;', 'uniform mat4 uModel;',
    'varying vec3 vNormal;', 'varying vec3 vWorld;',
    'void main() {',
    '  vec4 w = uModel * vec4(aPos, 1.0);',
    '  vWorld = w.xyz;',
    '  vNormal = normalize(mat3(uModel) * aNormal);',
    '  gl_Position = uProj * w;',
    '}'
  ].join('\n');
  var FS = [
    'precision mediump float;',
    'varying vec3 vNormal;', 'varying vec3 vWorld;',
    'uniform sampler2D uBase;', 'uniform sampler2D uRough;', 'uniform sampler2D uMetal;', 'uniform sampler2D uEnv;',
    'uniform vec3 uCam;', 'uniform float uTime;',
    'vec3 envLook(vec3 d) {',
    '  float u = atan(d.z, d.x) / 6.2831853 + 0.5;',
    '  float v = clamp(asin(clamp(d.y, -1.0, 1.0)) / 3.1415926 + 0.5, 0.0, 1.0);',
    '  return texture2D(uEnv, vec2(u, 1.0 - v)).rgb;',
    '}',
    'void main() {',
    '  vec3 base = texture2D(uBase, vec2(vWorld.x * 0.8 + vWorld.y * 0.35, vWorld.y * 0.8 + vWorld.z * 0.35)).rgb;',
    '  float authoredRough = texture2D(uRough, vec2(vWorld.x * 0.8 + 0.2, vWorld.y * 0.8 + 0.3)).r;',
    '  float authoredMetal = texture2D(uMetal, vec2(vWorld.x * 0.8 + 0.2, vWorld.y * 0.8 + 0.3)).r;',
    '  float materialZone = smoothstep(-0.42, 0.42, vWorld.x);',
    '  float rough = mix(mix(0.86, authoredRough, 0.22), mix(0.12, authoredRough, 0.22), materialZone);',
    '  float metal = mix(mix(0.03, authoredMetal, 0.18), mix(0.94, authoredMetal, 0.18), materialZone);',
    '  vec3 N = normalize(vNormal);',
    '  vec3 V = normalize(uCam - vWorld);',
    '  vec3 L = normalize(vec3(0.55, 0.8, 0.6));',
    '  float diff = max(dot(N, L), 0.0);',
    '  vec3 H = normalize(L + V);',
    '  float ndh = max(dot(N, H), 0.0);',
    '  float a = rough * rough + 0.001;',
    '  float spec = pow(ndh, 2.0 / (a * a)) * (1.0 - rough) * 0.35;',
    '  vec3 F0 = mix(vec3(0.04), base, metal);',
    '  vec3 env = envLook(reflect(-V, N));',
    '  vec3 amb = envLook(N) * 0.55;',
    '  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);',
    '  vec3 col = base * (diff * vec3(1.0, 0.99, 0.9) * 1.35 + amb * (1.0 - metal * 0.65));',
    '  col += F0 * env * (0.35 + 0.65 * metal) + spec * mix(vec3(1.0), base, metal);',
    '  col += rim * vec3(0.72, 0.85, 0.28) * 0.30;',
    '  col = col / (col + vec3(1.0));',
    '  col = pow(col, vec3(1.0 / 2.2));',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
    return sh;
  }
  function makeTexture(data, w, h, flip) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip ? true : false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }
  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve({ data: c.getContext('2d').getImageData(0, 0, c.width, c.height).data, width: c.width, height: c.height });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /* ---------------- mat helpers ---------------- */
  function persp(fov, aspect, near, far) {
    var f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function rotY(t) { var c = Math.cos(t), s = Math.sin(t); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
  function rotX(t) { var c = Math.cos(t), s = Math.sin(t); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
  function trans(x, y, z) { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); }

  /* ---------------- scene state ---------------- */
  var model = null, count = 0, indexType = 0;
  var uProj, uModel, uCam, uTime, envTex;
  var camPos = [0, 0, 3.4];
  var pointerX = 0, pointerY = 0, scrollT = 0;
  var inView = true, raf = 0, running = false, t0 = performance.now();

  function resize() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  }

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    render();
  }
  function render() {
    resize();
    var t = (performance.now() - t0) / 1000;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!model) return;
    gl.useProgram(model.prog);
    var aspect = canvas.width / canvas.height;
    var proj = persp(0.62, aspect, 0.1, 20);
    var spin = prefersReduced() ? 0.6 : t * 0.24 + scrollT * 1.6;
    var tilt = (prefersReduced() ? 0.12 : 0.12 + pointerY * 0.22 + Math.sin(t * 0.5) * 0.04);
    var m = mul(trans(0, 0, 0), mul(rotX(tilt), rotY(spin)));
    gl.uniformMatrix4fv(uProj, false, proj);
    gl.uniformMatrix4fv(uModel, false, m);
    gl.uniform3fv(uCam, camPos);
    gl.uniform1f(uTime, t);
    gl.drawElements(gl.TRIANGLES, count, indexType, 0);
  }

  function startLoop() {
    if (running || prefersReduced()) { render(); return; }
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stopLoop() { running = false; if (raf) cancelAnimationFrame(raf); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) startLoop(); else stopLoop();
    }, { threshold: 0.02 }).observe(hero);
  }
  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    pointerX = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
    pointerY = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
  }, { passive: true });
  window.addEventListener('scroll', function () {
    scrollT = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)));
  }, { passive: true });
  window.addEventListener('resize', function () { if (model) render(); }, { passive: true });

  /* ---------------- boot: assets already loading, then render ---------------- */
  glAssets.then(function (parts) {
    var gltf = parseGLB(parts[0]);
    var hdr = parseHDR(new TextDecoder('utf-8').decode(new Uint8Array(parts[4]).slice(0, 2048)), parts[4]);

    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
    gl.useProgram(prog);

    var positions = accessorData(gltf, 0);
    var normals = accessorData(gltf, 1);
    var indices = accessorData(gltf, 2);
    indexType = indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    count = indices.length;

    function attrib(name, data, size) {
      var loc = gl.getAttribLocation(prog, name);
      if (loc < 0) return;
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
    attrib('aPos', positions, 3);
    attrib('aNormal', normals, 3);
    var ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    function unit(i) { gl.activeTexture(gl.TEXTURE0 + i); return i; }
    var baseTex = makeTexture(parts[1].data, parts[1].width, parts[1].height, true);
    var roughTex = makeTexture(parts[2].data, parts[2].width, parts[2].height, true);
    var metalTex = makeTexture(parts[3].data, parts[3].width, parts[3].height, true);
    envTex = makeTexture(hdrToTextureBytes(hdr), hdr.width, hdr.height, false);
    gl.uniform1i(gl.getUniformLocation(prog, 'uBase'), unit(0));
    gl.bindTexture(gl.TEXTURE_2D, baseTex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uRough'), unit(1));
    gl.bindTexture(gl.TEXTURE_2D, roughTex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uMetal'), unit(2));
    gl.bindTexture(gl.TEXTURE_2D, metalTex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uEnv'), unit(3));
    gl.bindTexture(gl.TEXTURE_2D, envTex);

    uProj = gl.getUniformLocation(prog, 'uProj');
    uModel = gl.getUniformLocation(prog, 'uModel');
    uCam = gl.getUniformLocation(prog, 'uCam');
    uTime = gl.getUniformLocation(prog, 'uTime');

    gl.enable(gl.DEPTH_TEST);
    model = { prog: prog };
    canvas.classList.add('is-live');
    if (inView) startLoop(); else render();
  }).catch(function () {
    // Any asset / GL failure: the static SVG hero composition remains.
  });
})();
