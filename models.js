// Procedural wireframe holograms for the Tech view, built with Three.js.
// Every model is a group of edge-line primitives, normalised to fit a unit sphere.
window.SWModels = (function () {
  const BLUE = 0x4f7bff, DIM = 0x2f57e8, RED = 0xff3b3b, GREEN = 0x4ce0a0, WHITE = 0xdfe7ff;

  function edges(geom, { pos = [0, 0, 0], rot = [0, 0, 0], color = BLUE, opacity = 0.9, thresh = 20 } = {}) {
    const e = new THREE.EdgesGeometry(geom, thresh);
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const l = new THREE.LineSegments(e, m);
    l.position.set(...pos); l.rotation.set(...rot);
    return l;
  }
  function wire(geom, { pos = [0, 0, 0], rot = [0, 0, 0], color = DIM, opacity = 0.35 } = {}) {
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const l = new THREE.LineSegments(new THREE.WireframeGeometry(geom), m);
    l.position.set(...pos); l.rotation.set(...rot);
    return l;
  }
  function glow(geom, { pos = [0, 0, 0], rot = [0, 0, 0], color = BLUE, opacity = 0.55 } = {}) {
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(geom, m);
    mesh.position.set(...pos); mesh.rotation.set(...rot);
    return mesh;
  }
  const cyl = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const sph = (r, a = 12, b = 8) => new THREE.SphereGeometry(r, a, b);
  const cone = (r, h, seg = 8) => new THREE.ConeGeometry(r, h, seg);
  const tor = (r, t, a = 12, b = 24) => new THREE.TorusGeometry(r, t, a, b);
  const X = Math.PI / 2;

  const builders = {
    lightsaber(g) {
      g.add(edges(cyl(0.11, 0.11, 1.1, 12), { pos: [0, -0.55, 0] }));
      g.add(edges(cyl(0.13, 0.13, 0.25, 12), { pos: [0, -0.15, 0] }));
      g.add(edges(cyl(0.12, 0.09, 0.15, 12), { pos: [0, -1.15, 0] }));
      for (let i = 0; i < 4; i++) g.add(edges(box(0.04, 0.5, 0.04), { pos: [Math.cos(i * X) * 0.12, -0.7, Math.sin(i * X) * 0.12] }));
      g.add(glow(cyl(0.05, 0.05, 2.4, 8), { pos: [0, 1.2, 0], color: BLUE, opacity: 0.75 }));
      g.add(glow(cyl(0.11, 0.11, 2.4, 8), { pos: [0, 1.2, 0], color: BLUE, opacity: 0.18 }));
      g.add(glow(sph(0.06), { pos: [0, 2.4, 0], opacity: 0.8 }));
    },
    darksaber(g) {
      g.add(edges(cyl(0.11, 0.1, 1.0, 8), { pos: [0, -0.5, 0] }));
      g.add(edges(box(0.32, 0.12, 0.08), { pos: [0, 0.05, 0] }));
      const blade = new THREE.Shape(); blade.moveTo(-0.12, 0); blade.lineTo(0.12, 0); blade.lineTo(0.05, 2.1); blade.lineTo(-0.02, 2.2); blade.lineTo(-0.12, 0);
      const bg = new THREE.ExtrudeGeometry(blade, { depth: 0.03, bevelEnabled: false });
      g.add(edges(bg, { pos: [0, 0.1, -0.015], color: WHITE, opacity: 1 }));
      g.add(glow(bg, { pos: [0, 0.1, -0.015], color: 0x000000, opacity: 0.9 }));
      g.add(glow(cyl(0.16, 0.16, 2.1, 8), { pos: [0, 1.15, 0], color: WHITE, opacity: 0.08 }));
    },
    blaster(g) {
      g.add(edges(box(0.9, 0.22, 0.14), { pos: [0.1, 0, 0] }));
      g.add(edges(cyl(0.05, 0.05, 0.7, 10), { pos: [0.9, 0.03, 0], rot: [0, 0, X] }));
      g.add(edges(cyl(0.09, 0.09, 0.3, 10), { pos: [0.6, 0.03, 0], rot: [0, 0, X] }));
      g.add(edges(cyl(0.06, 0.06, 0.5, 8), { pos: [0.15, 0.2, 0], rot: [0, 0, X] }));
      g.add(edges(box(0.18, 0.5, 0.12), { pos: [-0.25, -0.33, 0], rot: [0, 0, 0.25] }));
      g.add(edges(tor(0.09, 0.015, 6, 16), { pos: [-0.05, -0.2, 0] }));
      g.add(edges(cone(0.08, 0.16, 8), { pos: [1.3, 0.03, 0], rot: [0, 0, -X] }));
    },
    rifle(g) {
      g.add(edges(box(1.4, 0.16, 0.12), { pos: [0, 0, 0] }));
      g.add(edges(cyl(0.06, 0.06, 0.6, 10), { pos: [1.0, 0, 0], rot: [0, 0, X] }));
      g.add(edges(box(0.3, 0.06, 0.06), { pos: [0.55, 0.16, 0] }));
      g.add(edges(cyl(0.05, 0.05, 0.35, 8), { pos: [-0.2, 0.17, 0], rot: [0, 0, X] }));
      g.add(edges(box(0.14, 0.34, 0.1), { pos: [-0.4, -0.25, 0], rot: [0, 0, 0.2] }));
      g.add(edges(box(0.08, 0.28, 0.1), { pos: [0.2, -0.2, 0] }));
      g.add(edges(box(0.5, 0.08, 0.08), { pos: [-0.95, 0.06, 0] }));
      g.add(edges(box(0.06, 0.26, 0.1), { pos: [-1.2, -0.06, 0] }));
    },
    detonator(g) {
      g.add(edges(sph(0.7, 16, 12), { thresh: 10 }));
      g.add(wire(sph(0.7, 16, 12), { opacity: 0.2 }));
      g.add(edges(cyl(0.22, 0.22, 0.12, 12), { pos: [0, 0.72, 0] }));
      g.add(edges(tor(0.7, 0.02, 4, 32), { rot: [X, 0, 0] }));
      g.add(edges(tor(0.7, 0.02, 4, 32), { rot: [0, 0, 0] }));
      g.add(glow(sph(0.08), { pos: [0, 0.82, 0], color: RED, opacity: 0.9 }));
    },
    bowcaster(g) {
      g.add(edges(box(1.1, 0.2, 0.16), { pos: [0.1, 0, 0] }));
      g.add(edges(cyl(0.05, 0.05, 0.5, 8), { pos: [0.85, 0.04, 0], rot: [0, 0, X] }));
      g.add(edges(tor(0.8, 0.03, 6, 20, Math.PI), { pos: [0.3, 0, 0], rot: [X, 0, 0] }));
      g.add(edges(box(0.02, 0.02, 1.6), { pos: [0.3, 0, 0], color: WHITE }));
      g.add(edges(box(0.18, 0.5, 0.14), { pos: [-0.35, -0.3, 0], rot: [0, 0, 0.2] }));
      g.add(edges(box(0.5, 0.1, 0.1), { pos: [-0.8, 0.05, 0] }));
      g.add(edges(box(0.3, 0.14, 0.14), { pos: [-0.1, 0.2, 0] }));
    },
    helmet(g) {
      const dome = new THREE.SphereGeometry(0.75, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
      g.add(edges(dome, { pos: [0, 0.1, 0], thresh: 12 }));
      g.add(wire(dome, { pos: [0, 0.1, 0], opacity: 0.15 }));
      g.add(edges(cyl(0.75, 0.72, 0.6, 16), { pos: [0, -0.2, 0] }));
      const t = new THREE.Shape(); t.moveTo(-0.5, 0.1); t.lineTo(0.5, 0.1); t.lineTo(0.5, -0.05); t.lineTo(0.06, -0.05); t.lineTo(0.06, -0.55); t.lineTo(-0.06, -0.55); t.lineTo(-0.06, -0.05); t.lineTo(-0.5, -0.05); t.lineTo(-0.5, 0.1);
      const tg = new THREE.ExtrudeGeometry(t, { depth: 0.05, bevelEnabled: false });
      g.add(edges(tg, { pos: [0, 0.05, 0.7], color: WHITE }));
      g.add(glow(tg, { pos: [0, 0.05, 0.7], color: 0x000000, opacity: 0.85 }));
      g.add(edges(box(0.24, 0.1, 0.3), { pos: [0.82, 0.1, 0] }));
      g.add(edges(box(0.24, 0.1, 0.3), { pos: [-0.82, 0.1, 0] }));
    },
    holocron(g) {
      g.add(edges(box(1.2, 1.2, 1.2), { color: WHITE }));
      const inner = box(0.8, 0.8, 0.8);
      g.add(edges(inner, { rot: [0.6, 0.6, 0], color: BLUE }));
      g.add(edges(box(0.45, 0.45, 0.45), { rot: [-0.4, 0.9, 0.3], color: GREEN }));
      g.add(glow(sph(0.18), { color: GREEN, opacity: 0.8 }));
      g.add(glow(sph(0.4), { color: GREEN, opacity: 0.12 }));
      for (const s of [1, -1]) g.add(edges(box(0.1, 1.3, 0.1), { pos: [s * 0.6, 0, 0.6] }));
    },
    astromech(g) {
      g.add(edges(cyl(0.5, 0.5, 1.1, 16), { pos: [0, -0.2, 0] }));
      g.add(edges(new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, 0, X), { pos: [0, 0.35, 0], thresh: 12 }));
      g.add(edges(cyl(0.5, 0.5, 0.08, 16), { pos: [0, 0.35, 0] }));
      g.add(glow(sph(0.08), { pos: [0, 0.55, 0.47], color: RED, opacity: 0.9 }));
      for (const s of [1, -1]) {
        g.add(edges(box(0.18, 0.5, 0.3), { pos: [s * 0.62, 0.05, 0] }));
        g.add(edges(box(0.2, 1.0, 0.2), { pos: [s * 0.62, -0.5, 0.05] }));
        g.add(edges(box(0.22, 0.2, 0.45), { pos: [s * 0.62, -0.95, 0.2] }));
      }
      g.add(edges(box(0.2, 0.2, 0.4), { pos: [0, -0.9, 0.1] }));
      g.add(edges(box(0.4, 0.1, 0.1), { pos: [0, -0.1, 0.48] }));
      g.add(edges(box(0.25, 0.18, 0.05), { pos: [0.1, 0.1, 0.5] }));
    },
    carbonite(g) {
      g.add(edges(box(1.0, 1.8, 0.22), { color: DIM }));
      g.add(wire(box(1.0, 1.8, 0.22), { opacity: 0.15 }));
      g.add(edges(box(0.9, 1.7, 0.1), { pos: [0, 0, 0.12], color: BLUE, opacity: 0.6 }));
      g.add(edges(sph(0.18, 10, 8), { pos: [0, 0.55, 0.2] }));
      g.add(edges(box(0.5, 0.55, 0.16), { pos: [0, 0.05, 0.2] }));
      g.add(edges(box(0.14, 0.7, 0.14), { pos: [-0.3, -0.2, 0.2], rot: [0, 0, -0.5] }));
      g.add(edges(box(0.14, 0.7, 0.14), { pos: [0.3, -0.2, 0.2], rot: [0, 0, 0.5] }));
      for (const s of [1, -1]) g.add(edges(box(0.18, 0.75, 0.16), { pos: [s * 0.14, -0.62, 0.2] }));
      for (let i = 0; i < 4; i++) g.add(edges(box(0.12, 0.08, 0.1), { pos: [-0.35 + i * 0.23, -0.82, 0.2], color: RED }));
    },
    xwing(g) {
      g.add(edges(cyl(0.12, 0.2, 2.2, 8), { rot: [0, 0, X] }));
      g.add(edges(cone(0.12, 0.6, 8), { pos: [1.4, 0, 0], rot: [0, 0, -X] }));
      g.add(edges(box(0.5, 0.25, 0.3), { pos: [0.2, 0.2, 0] }));
      g.add(edges(box(0.5, 0.45, 0.5), { pos: [-0.9, 0, 0] }));
      const ang = 0.22;
      for (const sx of [1, -1]) for (const sy of [1, -1]) {
        const w = new THREE.Group();
        w.add(edges(box(1.6, 0.04, 0.9), { pos: [-0.4, 0, 0] }));
        w.add(edges(cyl(0.12, 0.12, 0.6, 10), { pos: [-0.9, 0, 0.2], rot: [0, 0, X] }));
        w.add(edges(cyl(0.03, 0.03, 1.0, 6), { pos: [0.6, 0, 0.5], rot: [0, 0, X] }));
        w.add(glow(cyl(0.12, 0.05, 0.3, 8), { pos: [-1.3, 0, 0.2], rot: [0, 0, X], color: RED, opacity: 0.5 }));
        w.position.set(0, sy * 0.12, 0); w.rotation.x = sy * sx * ang; w.scale.z = sx;
        g.add(w);
      }
    },
    tie(g) {
      g.add(edges(sph(0.42, 14, 10), { thresh: 10 }));
      g.add(edges(cyl(0.3, 0.3, 0.06, 16), { pos: [0, 0, 0.42], rot: [X, 0, 0] }));
      g.add(edges(tor(0.22, 0.02, 4, 8), { pos: [0, 0, 0.45] }));
      for (const s of [1, -1]) {
        g.add(edges(cyl(0.12, 0.12, 0.5, 8), { pos: [s * 0.62, 0, 0], rot: [0, 0, X] }));
        const hex = new THREE.CylinderGeometry(1.15, 1.15, 0.03, 6);
        g.add(edges(hex, { pos: [s * 0.9, 0, 0], rot: [0, 0, X], color: BLUE }));
        g.add(wire(hex, { pos: [s * 0.9, 0, 0], rot: [0, 0, X], opacity: 0.3 }));
        g.add(edges(box(0.06, 2.0, 0.04), { pos: [s * 0.9, 0, 0] }));
        g.add(edges(box(0.06, 0.04, 1.9), { pos: [s * 0.9, 0, 0] }));
      }
    },
    falcon(g) {
      g.add(edges(cyl(1.1, 1.1, 0.3, 24), { rot: [0, 0, 0] }));
      g.add(wire(cyl(1.1, 1.1, 0.3, 24), { opacity: 0.12 }));
      g.add(edges(cyl(0.45, 0.45, 0.42, 16), { pos: [0, 0, 0] }));
      g.add(edges(cyl(0.16, 0.16, 0.3, 10), { pos: [0.7, 0.2, 0.55], rot: [0, 0, 0] }));
      for (const s of [1, -1]) g.add(edges(box(1.3, 0.24, 0.35), { pos: [1.1, 0, s * 0.35], rot: [0, 0, 0] }));
      g.add(edges(cyl(0.12, 0.14, 0.6, 8), { pos: [0, 0.3, 0], rot: [X, 0, 0] }));
      g.add(edges(cyl(0.12, 0.14, 0.6, 8), { pos: [0, -0.3, 0], rot: [X, 0, 0] }));
      g.add(edges(box(0.4, 0.25, 0.25), { pos: [0, 0.05, 1.05] }));
      g.add(edges(cone(0.08, 0.6, 6), { pos: [0.3, 0, 1.15], rot: [0, 0, -X] }));
      g.add(glow(box(0.1, 0.16, 1.7), { pos: [-1.12, 0, 0], color: BLUE, opacity: 0.55 }));
    },
    stardestroyer(g) {
      const s = new THREE.Shape(); s.moveTo(1.6, 0); s.lineTo(-1.2, 0.9); s.lineTo(-1.2, -0.9); s.lineTo(1.6, 0);
      const hull = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false });
      g.add(edges(hull, { pos: [0, -0.06, 0], rot: [X, 0, 0] }));
      const upper = new THREE.Shape(); upper.moveTo(1.2, 0); upper.lineTo(-1.1, 0.55); upper.lineTo(-1.1, -0.55); upper.lineTo(1.2, 0);
      const ug = new THREE.ExtrudeGeometry(upper, { depth: 0.16, bevelEnabled: false });
      g.add(edges(ug, { pos: [0, 0.06, 0], rot: [X, 0, 0] }));
      g.add(edges(box(0.5, 0.3, 0.5), { pos: [-0.7, 0.35, 0] }));
      g.add(edges(box(0.7, 0.16, 0.3), { pos: [-0.7, 0.55, 0] }));
      for (const z of [1, -1]) { g.add(edges(sph(0.1, 8, 6), { pos: [-0.7, 0.62, z * 0.25] })); }
      g.add(edges(box(0.06, 0.6, 0.06), { pos: [-0.7, 0.85, 0] }));
      for (const z of [0.45, 0, -0.45]) g.add(glow(cyl(0.12, 0.09, 0.16, 8), { pos: [-1.25, 0, z], rot: [0, 0, X], color: BLUE, opacity: 0.6 }));
      g.add(edges(box(0.4, 0.05, 0.05), { pos: [-1.2, 0.2, 0], color: DIM }));
    },
    atat(g) {
      g.add(edges(box(1.4, 0.55, 0.7), { pos: [0, 0.6, 0] }));
      g.add(edges(box(0.5, 0.3, 0.45), { pos: [1.15, 0.65, 0], rot: [0, 0, -0.15] }));
      g.add(edges(cyl(0.12, 0.12, 0.35, 8), { pos: [0.85, 0.6, 0], rot: [0, 0, X] }));
      for (const s of [1, -1]) g.add(edges(cyl(0.04, 0.04, 0.4, 6), { pos: [1.45, 0.6, s * 0.14], rot: [0, 0, X] }));
      const legs = [[0.55, 1], [0.55, -1], [-0.55, 1], [-0.55, -1]];
      legs.forEach(([x, z], i) => {
        const k = i % 2 ? 0.15 : -0.15;
        g.add(edges(box(0.16, 0.7, 0.16), { pos: [x + k, 0.05, z * 0.42], rot: [0, 0, k * 1.5] }));
        g.add(edges(box(0.14, 0.75, 0.14), { pos: [x - k, -0.55, z * 0.42], rot: [0, 0, -k * 1.2] }));
        g.add(edges(cyl(0.18, 0.2, 0.12, 8), { pos: [x - k * 1.6, -0.95, z * 0.42] }));
      });
    },
    speederbike(g) {
      g.add(edges(box(1.0, 0.18, 0.22), { pos: [0.2, 0, 0] }));
      g.add(edges(box(0.5, 0.12, 0.3), { pos: [-0.2, 0.12, 0] }));
      g.add(edges(cyl(0.05, 0.05, 1.0, 6), { pos: [1.1, 0.0, 0], rot: [0, 0, X] }));
      for (const s of [1, -1]) g.add(edges(box(0.5, 0.06, 0.12), { pos: [1.45, 0.05, s * 0.1], rot: [0, s * 0.3, 0] }));
      g.add(edges(cyl(0.03, 0.03, 0.5, 6), { pos: [0.4, 0.25, 0], rot: [X, 0, 0] }));
      g.add(edges(box(0.3, 0.3, 0.22), { pos: [-0.75, 0.0, 0] }));
      g.add(edges(box(0.15, 0.5, 0.05), { pos: [-0.9, 0.1, 0.12], rot: [0, 0, 0.3] }));
      g.add(glow(cyl(0.1, 0.06, 0.2, 8), { pos: [-1.0, 0, 0], rot: [0, 0, X], color: BLUE, opacity: 0.55 }));
      g.add(edges(cyl(0.04, 0.04, 0.5, 6), { pos: [0.1, -0.2, 0], rot: [0, 0, 0.6] }));
    },
    landspeeder(g) {
      const body = new THREE.Shape(); body.moveTo(-1.0, -0.15); body.lineTo(0.9, -0.15); body.lineTo(1.1, 0); body.lineTo(0.6, 0.18); body.lineTo(-0.9, 0.15); body.lineTo(-1.0, -0.15);
      g.add(edges(new THREE.ExtrudeGeometry(body, { depth: 0.9, bevelEnabled: false }), { pos: [0, 0, -0.45] }));
      g.add(edges(box(0.5, 0.25, 0.5), { pos: [-0.1, 0.28, 0], color: DIM }));
      g.add(edges(cyl(0.16, 0.16, 0.55, 10), { pos: [-0.75, 0.15, 0.45], rot: [0, 0, X] }));
      g.add(edges(cyl(0.16, 0.16, 0.55, 10), { pos: [-0.75, 0.15, -0.45], rot: [0, 0, X] }));
      g.add(edges(cyl(0.12, 0.12, 0.5, 10), { pos: [-0.8, 0.35, 0], rot: [0, 0, X] }));
      g.add(edges(box(0.3, 0.15, 0.45), { pos: [0.15, 0.1, 0] }));
    },
    deathstar(g) {
      g.add(edges(sph(1.0, 24, 16), { thresh: 5, opacity: 0.55 }));
      g.add(wire(sph(1.0, 24, 16), { opacity: 0.12 }));
      g.add(edges(tor(1.0, 0.012, 4, 48), { rot: [X, 0, 0], color: WHITE, opacity: 0.8 }));
      const dish = new THREE.SphereGeometry(0.34, 14, 10, 0, Math.PI * 2, 0, X);
      g.add(edges(dish, { pos: [0.72, 0.42, 0.4], rot: [-0.6, 0.9, 0.5], thresh: 8, color: BLUE }));
      g.add(glow(sph(0.06), { pos: [0.72, 0.42, 0.4], color: GREEN, opacity: 0.9 }));
      for (let i = 0; i < 6; i++) g.add(edges(tor(1.0, 0.006, 3, 48), { rot: [0, i * Math.PI / 6, 0], color: DIM, opacity: 0.5 }));
    },
    firespray(g) {
      g.add(edges(box(0.9, 1.4, 0.5), { pos: [0, 0, 0] }));
      g.add(edges(cyl(0.5, 0.5, 0.35, 16), { pos: [0, 0, 0.35], rot: [X, 0, 0] }));
      g.add(edges(box(0.5, 0.4, 0.3), { pos: [0, 0.8, 0.15] }));
      for (const s of [1, -1]) {
        g.add(edges(box(0.2, 0.9, 0.08), { pos: [s * 0.65, -0.1, 0], rot: [0, 0, s * 0.1] }));
        g.add(edges(cyl(0.05, 0.05, 0.5, 6), { pos: [s * 0.25, -0.85, 0.2] }));
      }
      g.add(glow(cyl(0.16, 0.16, 0.4, 10), { pos: [0, -0.75, 0], color: BLUE, opacity: 0.5 }));
    },
    razorcrest(g) {
      g.add(edges(box(1.6, 0.45, 0.7), { pos: [0, 0, 0] }));
      g.add(edges(box(0.5, 0.35, 0.5), { pos: [1.0, 0.1, 0], rot: [0, 0, 0.1] }));
      for (const s of [1, -1]) {
        g.add(edges(box(0.3, 0.3, 0.9), { pos: [-0.2, 0, s * 0.75] }));
        g.add(edges(cyl(0.16, 0.16, 1.2, 10), { pos: [-0.3, 0, s * 0.75], rot: [0, 0, X] }));
        g.add(glow(cyl(0.14, 0.1, 0.25, 8), { pos: [-0.95, 0, s * 0.75], rot: [0, 0, X], color: BLUE, opacity: 0.55 }));
      }
      g.add(edges(box(0.4, 0.5, 0.06), { pos: [-0.7, 0.3, 0] }));
    },
    n1(g) {
      g.add(edges(cyl(0.16, 0.22, 1.6, 10), { rot: [0, 0, X] }));
      g.add(edges(cone(0.05, 1.3, 6), { pos: [-1.45, 0, 0], rot: [0, 0, X] }));
      g.add(edges(sph(0.2, 10, 8), { pos: [0.3, 0.15, 0] }));
      for (const s of [1, -1]) {
        g.add(edges(box(1.1, 0.05, 0.6), { pos: [0.1, 0, s * 0.55] }));
        g.add(edges(cyl(0.12, 0.12, 0.9, 10), { pos: [0.1, 0, s * 0.85], rot: [0, 0, X] }));
        g.add(edges(cone(0.05, 1.0, 6), { pos: [-0.9, 0, s * 0.85], rot: [0, 0, X] }));
        g.add(glow(cyl(0.1, 0.06, 0.2, 8), { pos: [0.6, 0, s * 0.85], rot: [0, 0, X], color: BLUE, opacity: 0.5 }));
      }
    },
    ghost(g) {
      g.add(edges(box(1.5, 0.4, 1.0), { pos: [0, 0, 0] }));
      g.add(edges(box(0.8, 0.3, 0.6), { pos: [0.9, 0.1, 0] }));
      g.add(edges(cyl(0.2, 0.2, 0.25, 12), { pos: [0.2, 0.32, 0] }));
      g.add(edges(box(0.6, 0.35, 0.5), { pos: [-0.85, 0.1, 0] }));
      for (const s of [1, -1]) {
        g.add(edges(box(0.9, 0.2, 0.3), { pos: [-0.3, 0, s * 0.65] }));
        g.add(glow(cyl(0.12, 0.08, 0.2, 8), { pos: [-0.85, 0, s * 0.65], rot: [0, 0, X], color: BLUE, opacity: 0.55 }));
      }
      g.add(edges(cyl(0.05, 0.05, 0.5, 6), { pos: [1.35, 0.1, 0.3], rot: [0, 0, X] }));
      g.add(edges(cyl(0.05, 0.05, 0.5, 6), { pos: [1.35, 0.1, -0.3], rot: [0, 0, X] }));
    },
  };

  function build(key) {
    const g = new THREE.Group();
    (builders[key] || builders.holocron)(g);
    // normalise to unit sphere
    const bb = new THREE.Box3().setFromObject(g);
    const c = bb.getCenter(new THREE.Vector3());
    const r = bb.getSize(new THREE.Vector3()).length() / 2;
    g.position.sub(c);
    const wrap = new THREE.Group();
    wrap.add(g);
    wrap.scale.setScalar(1 / (r || 1));
    return wrap;
  }

  // grid ring under every model, like a projector base
  function base() {
    const g = new THREE.Group();
    g.add(edges(tor(1.15, 0.004, 3, 64), { rot: [X, 0, 0], pos: [0, -1.1, 0], color: DIM, opacity: 0.6 }));
    g.add(edges(tor(0.8, 0.003, 3, 48), { rot: [X, 0, 0], pos: [0, -1.1, 0], color: DIM, opacity: 0.35 }));
    return g;
  }

  // One shared offscreen renderer for thumbnails; a live renderer for the panel.
  let shared = null;
  function sharedRenderer() {
    if (!shared) {
      shared = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      shared.setPixelRatio(Math.min(devicePixelRatio, 2));
      shared.setSize(220, 220);
    }
    return shared;
  }
  function scene(key, withBase) {
    const sc = new THREE.Scene();
    const model = build(key);
    sc.add(model);
    if (withBase) sc.add(base());
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    cam.position.set(0, 1.0, 4.2); cam.lookAt(0, -0.1, 0);
    return { sc, model, cam };
  }

  // Thumbnails: each canvas gets its own scene; one loop renders them all via the shared renderer.
  const thumbs = new Map();
  let thumbRAF = 0;
  function thumb(canvas, key) {
    const s = scene(key, false);
    s.model.rotation.y = Math.random() * Math.PI * 2;
    thumbs.set(canvas, s);
    if (!thumbRAF) thumbLoop();
  }
  function thumbLoop() {
    thumbRAF = requestAnimationFrame(thumbLoop);
    if (!thumbs.size) return;
    const r = sharedRenderer();
    const t = performance.now() / 1000;
    for (const [canvas, s] of thumbs) {
      if (!canvas.isConnected) { thumbs.delete(canvas); continue; }
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.bottom < 0 || rect.top > innerHeight) continue;
      s.model.rotation.y += 0.004;
      s.model.position.y = Math.sin(t * 1.2 + rect.left) * 0.04;
      r.render(s.sc, s.cam);
      const ctx = canvas.getContext("2d");
      if (canvas.width !== 220) { canvas.width = 220; canvas.height = 220; }
      ctx.clearRect(0, 0, 220, 220);
      ctx.drawImage(r.domElement, 0, 0, 220, 220);
    }
  }
  function clearThumbs() { thumbs.clear(); }

  // Live, orbitable model for the panel. Returns a dispose function.
  function mount(container, key) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const { sc, model, cam } = scene(key, true);
    container.appendChild(renderer.domElement);
    let rotY = 0.6, rotX = 0.15, dist = 4.4, auto = true, dragging = false, lx = 0, ly = 0, vy = 0, alive = true, spin = 6;
    function resize() {
      const w = container.clientWidth || 300, h = container.clientHeight || 240;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(container);
    const down = (e) => { dragging = true; auto = false; lx = e.clientX; ly = e.clientY; vy = 0; container.setPointerCapture(e.pointerId); };
    const move = (e) => { if (!dragging) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; vy = dx * 0.008; rotY += vy; rotX = Math.max(-1.2, Math.min(1.2, rotX + dy * 0.008)); };
    const up = () => { dragging = false; };
    const wheel = (e) => { e.preventDefault(); dist = Math.max(2.2, Math.min(9, dist + e.deltaY * 0.004)); };
    container.addEventListener("pointerdown", down); container.addEventListener("pointermove", move);
    container.addEventListener("pointerup", up); container.addEventListener("pointercancel", up);
    container.addEventListener("wheel", wheel, { passive: false });
    function frame() {
      if (!alive) return;
      requestAnimationFrame(frame);
      if (spin > 0) { spin *= 0.9; rotY += spin * 0.08; if (spin < 0.01) spin = 0; }   // arrival spin
      else if (auto) rotY += 0.005;
      else if (!dragging) { rotY += vy; vy *= 0.94; }
      model.rotation.set(rotX, rotY, 0);
      const s = 1 + (spin > 0 ? spin * 0.05 : 0);
      model.scale.setScalar(s);
      cam.position.set(0, 1.0 * (dist / 4.4), dist); cam.lookAt(0, -0.1, 0);
      renderer.render(sc, cam);
    }
    frame();
    return () => { alive = false; ro.disconnect(); renderer.dispose(); renderer.domElement.remove(); };
  }

  return { build, thumb, clearThumbs, mount, keys: Object.keys(builders) };
})();
