// A small, on-demand 3D mesh viewer. No animation loop or GPU context is
// needed: triangulated round tubes are projected and lit when the view moves.
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => a.map((v, i) => v - b[i]);
const unit = a => { const n = Math.hypot(...a) || 1; return a.map(v => v / n); };
const rgb = hex => hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16));

export function buildHornMesh({ tubes, material, band, gems, rings }) {
  const faces = [], add = (a, b, c, color) => faces.push({ points: [a, b, c], color: rgb(color) });
  for (const [index, tube] of tubes.entries()) {
    const sections = tube.map(([x, y, nx, ny, radius], i) => Array.from({ length: 16 }, (_, j) => {
      const angle = j / 16 * Math.PI * 2;
      // Each ring is perpendicular to the same seeded centreline used by 2D.
      const rib = index === 0 ? 1 + .035 * Math.cos(i / (tube.length - 1) * rings * Math.PI * 2) : 1;
      return [x - 50 + nx * Math.cos(angle) * radius * rib, 50 - y - ny * Math.cos(angle) * radius * rib, Math.sin(angle) * radius * rib];
    }));
    for (let i = 0; i < sections.length - 1; i++) {
      const color = index === 0 && i < Math.round(tube.length * .09) ? band : material;
      for (let j = 0; j < 16; j++) {
        const k = (j + 1) % 16, a = sections[i][j], b = sections[i][k], c = sections[i + 1][k], d = sections[i + 1][j];
        add(a, b, c, color); add(a, c, d, color);
      }
    }
    // Dark inset mouth and a capped tip, visible when the horn turns.
    for (const i of [0, sections.length - 1]) {
      const [x, y] = tube[i], center = [x - 50, 50 - y, 0];
      for (let j = 0; j < 16; j++) add(center, sections[i][j], sections[i][(j + 1) % 16], i === 0 ? '#302a38' : material);
    }
  }
  for (const { center: [x, y, , , w], radius, color } of gems) {
    // Faceted, raised gems on the front surface, one per stat.
    const z = w * .94, tip = [x - 50, 50 - y, z + radius * .8];
    const ring = Array.from({ length: 6 }, (_, i) => [x - 50 + radius * Math.cos(i * Math.PI / 3), 50 - y + radius * Math.sin(i * Math.PI / 3), z]);
    for (let i = 0; i < 6; i++) add(tip, ring[i], ring[(i + 1) % 6], color);
  }
  return faces;
}

export function mountHornViewer(host, model, name) {
  const canvas = document.createElement('canvas');
  canvas.className = 'horn3d-canvas'; canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${name}, rotatable 3D view. Drag or use arrow keys to rotate. Home resets the view.`);
  canvas.setAttribute('aria-describedby', 'hornViewHelp');
  const context = canvas.getContext('2d');
  if (!context) return null;
  host.replaceChildren(canvas);
  const faces = buildHornMesh(model), light = unit([-.4, .6, 1]);
  const initial = { yaw: model.flip ? -.28 : .28, pitch: -.12 };
  let yaw = initial.yaw, pitch = initial.pitch, pointer = null;
  function draw() {
    const size = Math.max(1, host.clientWidth), ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * ratio); canvas.height = canvas.width;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, size, size);
    const rotate = ([x, y, z]) => {
      if (model.flip) x = -x;
      const a = x * Math.cos(yaw) + z * Math.sin(yaw), b = z * Math.cos(yaw) - x * Math.sin(yaw);
      return [a, y * Math.cos(pitch) - b * Math.sin(pitch), y * Math.sin(pitch) + b * Math.cos(pitch)];
    };
    const project = ([x, y, z]) => { const scale = size / 125 * 240 / (240 - z); return [size / 2 + x * scale, size / 2 - y * scale]; };
    const visible = faces.map(face => {
      const points = face.points.map(rotate), normal = unit(cross(sub(points[1], points[0]), sub(points[2], points[0])));
      // Both faces render so branched horns and their mouths stay solid.
      const intensity = .32 + .68 * Math.abs(normal.reduce((n, v, i) => n + v * light[i], 0));
      return { points: points.map(project), depth: points.reduce((n, p) => n + p[2], 0) / 3,
        color: `rgb(${face.color.map(v => Math.round(v * intensity)).join(',')})` };
    }).sort((a, b) => a.depth - b.depth);
    for (const { points, color } of visible) {
      context.beginPath(); context.moveTo(...points[0]); context.lineTo(...points[1]); context.lineTo(...points[2]); context.closePath();
      context.fillStyle = color; context.strokeStyle = color; context.lineWidth = .35; context.fill(); context.stroke();
    }
  }
  const controller = new AbortController(), options = { signal: controller.signal };
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 || pointer) return;
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); canvas.focus();
  }, options);
  canvas.addEventListener('pointermove', e => {
    if (!pointer || pointer.id !== e.pointerId) return;
    yaw += (e.clientX - pointer.x) * .012; pitch = Math.max(-1.4, Math.min(1.4, pitch + (e.clientY - pointer.y) * .012));
    pointer.x = e.clientX; pointer.y = e.clientY; draw();
  }, options);
  const release = e => { if (pointer?.id === e.pointerId) pointer = null; };
  canvas.addEventListener('pointerup', release, options); canvas.addEventListener('pointercancel', release, options); canvas.addEventListener('lostpointercapture', release, options);
  canvas.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    if (e.key === 'Home') { yaw = initial.yaw; pitch = initial.pitch; }
    else if (e.key === 'ArrowLeft') yaw -= .15;
    else if (e.key === 'ArrowRight') yaw += .15;
    else pitch = Math.max(-1.4, Math.min(1.4, pitch + (e.key === 'ArrowUp' ? -.15 : .15)));
    draw();
  }, options);
  const observer = new ResizeObserver(draw); observer.observe(host); draw();
  return { reset() { yaw = initial.yaw; pitch = initial.pitch; draw(); }, dispose() { controller.abort(); observer.disconnect(); } };
}
