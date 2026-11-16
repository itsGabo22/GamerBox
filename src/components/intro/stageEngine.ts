import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Points,
  Scene,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  Texture,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import type { StageSignal } from '@/lib/stageBus';

/**
 * "Obsidian Core" — fully procedural (no model or texture files).
 * One renderer drives both the startup intro and the compact login crystal.
 *
 * Intro timeline (seconds):
 *   0.0–0.8  motes drift in the dark (boot lines are DOM)
 *   0.8–2.0  motes stream along helical paths and condense into the crystal; camera dollies in
 *   2.0–2.3  the crystal pulses
 *   2.3–3.0  crack flash, shards burst outward, motes scatter into a dim field
 *   3.0–3.6  login: shards re-form as a small crystal at the top  ·  session: everything fades
 */
export const INTRO = { boot: 0.8, forged: 2.0, crack: 2.3, burst: 3.0, end: 3.6 } as const;

const RED = 0xe50914;
const RED_BRIGHT = 0xff003c;
const MINT = 0x5ee6a8;

export type StageMode = 'intro' | 'login' | 'exit';

export interface StageOptions {
  lowEnd: boolean;
  /** performance.now() at which the intro clock started (may be before the engine exists). */
  introStart: number;
  mode: StageMode;
  /** Called when the GPU cannot keep up or the context is lost; the host swaps to the CSS fallback. */
  onFallback: (reason: 'fps' | 'context') => void;
  allowFallback: boolean;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const easeOutBack = (t: number) => {
  const x = clamp01(t);
  return 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
};
const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

const SHARD_VERTEX = /* glsl */ `
  attribute vec3 aCenter;
  attribute float aRand;
  uniform float uBurst;
  mat3 gbRot(vec3 axis, float angle) {
    float s = sin(angle), c = cos(angle), oc = 1.0 - c;
    return mat3(
      oc * axis.x * axis.x + c,          oc * axis.x * axis.y + axis.z * s, oc * axis.z * axis.x - axis.y * s,
      oc * axis.x * axis.y - axis.z * s, oc * axis.y * axis.y + c,          oc * axis.y * axis.z + axis.x * s,
      oc * axis.z * axis.x + axis.y * s, oc * axis.y * axis.z - axis.x * s, oc * axis.z * axis.z + c
    );
  }
  vec3 gbShard(vec3 p) {
    vec3 dir = normalize(aCenter);
    vec3 local = p - aCenter;
    local = gbRot(normalize(vec3(aRand, 1.0 - aRand, 0.37)), uBurst * (2.5 + aRand * 7.0)) * local;
    local *= 1.0 - uBurst * 0.3;
    return aCenter + local + dir * uBurst * (2.2 + aRand * 4.2) - vec3(0.0, uBurst * uBurst * 0.9, 0.0);
  }
`;

export class StageEngine {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(35, 1, 0.1, 60);
  private core = new Group();
  private disposables: { dispose: () => void }[] = [];
  private raf = 0;
  private last = 0;
  private running = false;
  private disposed = false;

  private uBurst = { value: 0 };
  private crystalMat!: MeshPhysicalMaterial;
  private edgeMat!: ShaderMaterial;
  private moteMat!: ShaderMaterial;
  private glowMat!: SpriteMaterial;
  private glow!: Sprite;
  private ring!: Mesh;
  private ringMat!: MeshBasicMaterial;
  private motes!: Points;
  private keyLight!: PointLight;

  private mode: StageMode;
  private introStart: number;
  private elapsed = 0;

  // Smoothed scene state (login/exit modes damp toward targets; intro writes directly).
  private s = { scale: 0, y: 0, camZ: 6.6, burst: 0, field: 0, condense: 0, edge: 0, glow: 0, ring: 0, emissive: 0.1, motes: 0, ringScale: 1, fade: 1 };
  private spin = 0;
  private kick = 0;
  private flicker = 0;
  private focus = 0;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  // Performance monitor
  private perfT = 0;
  private perfFrames = 0;
  private lowSeconds = 0;
  private degraded = false;
  private moteCount: number;

  constructor(private canvas: HTMLCanvasElement, private opts: StageOptions) {
    this.mode = opts.mode;
    this.introStart = opts.introStart;
    this.moteCount = opts.lowEnd ? 600 : 1200;

    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !opts.lowEnd, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lowEnd ? 1 : 1.5));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.buildEnvironment();
    this.buildCrystal();
    this.buildMotes();
    this.scene.add(this.core);

    this.keyLight = new PointLight(RED_BRIGHT, 6, 12, 1.6);
    this.keyLight.position.set(1.6, 1.2, 2.4);
    const fill = new DirectionalLight(0xffffff, 0.55);
    fill.position.set(-2, 3, 4);
    this.scene.add(this.keyLight, fill);

    this.camera.position.set(0, 0, this.s.camZ);
    this.resize();

    canvas.addEventListener('webglcontextlost', this.onContextLost);
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);

    if (this.mode !== 'intro') this.snapToLogin();
    this.start();
  }

  // ── Scene construction ───────────────────────────────────────────────

  /** A tiny emissive "room" baked once into a PMREM so the obsidian has something to reflect. */
  private buildEnvironment() {
    const env = new Scene();
    const panel = (color: number, intensity: number, x: number, y: number, z: number, w: number, h: number) => {
      const geo = new BoxGeometry(w, h, 0.1);
      const mat = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity) });
      const mesh = new Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.lookAt(0, 0, 0);
      env.add(mesh);
      return [geo, mat];
    };
    const made = [
      ...panel(RED_BRIGHT, 5, -5, 1, 2, 4, 6),
      ...panel(0xffffff, 3.2, 3, 5, 3, 5, 2),
      ...panel(MINT, 1.6, 5, -3, -2, 3, 3),
      ...panel(RED, 2.2, 0, -5, 4, 6, 1.5),
    ];
    const pmrem = new PMREMGenerator(this.renderer);
    const target = pmrem.fromScene(env, 0.05);
    this.scene.environment = target.texture;
    this.disposables.push(target, pmrem, ...made);
  }

  private buildCrystal() {
    // Faceted, slightly irregular gem: jitter is derived from the vertex position so shared corners stay welded.
    const geo = new IcosahedronGeometry(1, 1);
    geo.scale(0.8, 1.3, 0.8);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1;
      const k = 1 + (n - 0.5) * 0.24;
      pos.setXYZ(i, x * k, y * k, z * k);
    }
    geo.computeVertexNormals();

    const faces = pos.count / 3;
    const centers = new Float32Array(pos.count * 3);
    const rands = new Float32Array(pos.count);
    const edgePos = new Float32Array(faces * 18);
    const edgeCenter = new Float32Array(faces * 18);
    const edgeRand = new Float32Array(faces * 6);
    for (let f = 0; f < faces; f++) {
      const v = [0, 1, 2].map((k) => [pos.getX(f * 3 + k), pos.getY(f * 3 + k), pos.getZ(f * 3 + k)]);
      const c = [0, 1, 2].map((axis) => (v[0][axis] + v[1][axis] + v[2][axis]) / 3);
      const r = Math.abs(Math.sin((f + 1) * 91.17) * 9973.13) % 1;
      for (let k = 0; k < 3; k++) {
        centers.set(c, (f * 3 + k) * 3);
        rands[f * 3 + k] = r;
      }
      [[0, 1], [1, 2], [2, 0]].forEach(([a, b], e) => {
        edgePos.set([...v[a], ...v[b]], f * 18 + e * 6);
        edgeCenter.set([...c, ...c], f * 18 + e * 6);
        edgeRand.set([r, r], f * 6 + e * 2);
      });
    }
    geo.setAttribute('aCenter', new Float32BufferAttribute(centers, 3));
    geo.setAttribute('aRand', new Float32BufferAttribute(rands, 1));

    this.crystalMat = new MeshPhysicalMaterial({
      color: 0x07070b,
      metalness: 0.4,
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      iridescence: 0.45,
      iridescenceIOR: 1.7,
      emissive: RED,
      emissiveIntensity: 0.1,
      envMapIntensity: 1.5,
      flatShading: true,
      side: DoubleSide,
      transparent: true,
    });
    this.crystalMat.onBeforeCompile = (shader) => {
      shader.uniforms.uBurst = this.uBurst;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${SHARD_VERTEX}`)
        .replace('#include <begin_vertex>', 'vec3 transformed = gbShard(position);');
    };
    const crystal = new Mesh(geo, this.crystalMat);
    crystal.frustumCulled = false;

    // Neon edges: one line set that follows the same shard motion.
    const edgeGeo = new BufferGeometry();
    edgeGeo.setAttribute('position', new Float32BufferAttribute(edgePos, 3));
    edgeGeo.setAttribute('aCenter', new Float32BufferAttribute(edgeCenter, 3));
    edgeGeo.setAttribute('aRand', new Float32BufferAttribute(edgeRand, 1));
    this.edgeMat = new ShaderMaterial({
      uniforms: { uBurst: this.uBurst, uColor: { value: new Color(RED_BRIGHT) }, uOpacity: { value: 0 } },
      vertexShader: `${SHARD_VERTEX}
        void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(gbShard(position * 1.004), 1.0); }`,
      fragmentShader: `uniform vec3 uColor; uniform float uOpacity;
        void main() { gl_FragColor = vec4(uColor * uOpacity, uOpacity); }`,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const edges = new LineSegments(edgeGeo, this.edgeMat);
    edges.frustumCulled = false;

    // Additive glow sprite instead of bloom post-processing.
    const glowTex = this.radialTexture();
    this.glowMat = new SpriteMaterial({ map: glowTex, color: RED_BRIGHT, blending: AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0 });
    this.glow = new Sprite(this.glowMat);
    this.glow.scale.setScalar(5.2);
    this.glow.renderOrder = -1;

    const ringGeo = new TorusGeometry(1.42, 0.007, 6, 128);
    this.ringMat = new MeshBasicMaterial({ color: RED_BRIGHT, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
    this.ring = new Mesh(ringGeo, this.ringMat);
    this.ring.rotation.x = 1.22;

    this.core.add(this.glow, crystal, edges, this.ring);
    this.disposables.push(geo, edgeGeo, ringGeo, glowTex, this.crystalMat, this.edgeMat, this.glowMat, this.ringMat);
  }

  private radialTexture(): Texture {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.35)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new CanvasTexture(c);
  }

  private buildMotes() {
    const count = this.moteCount;
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count * 4; i++) seeds[i] = Math.random();
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSeed', new Float32BufferAttribute(seeds, 4));
    this.moteMat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCondense: { value: 0 },
        uField: { value: 0 },
        uOpacity: { value: 0 },
        uSize: { value: 5.5 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uCore: { value: this.core.position },
        uColorA: { value: new Color(RED_BRIGHT) },
        uColorB: { value: new Color(MINT) },
      },
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform float uTime, uCondense, uField, uSize, uPixelRatio;
        uniform vec3 uCore;
        varying float vMint;
        varying float vAlpha;
        void main() {
          float stagger = aSeed.w * 0.55;
          float c = smoothstep(stagger, stagger + 0.45, uCondense);
          float ang = aSeed.x * 6.2831853 + uTime * (0.35 + aSeed.y * 0.9) + (1.0 - c) * 5.0 * (0.5 + aSeed.z);
          float r = mix(1.2 + aSeed.z * 2.6, 0.22 + aSeed.z * 0.7, c);
          float y = mix((aSeed.y - 0.5) * 6.5, (aSeed.y - 0.5) * 1.5, c);
          vec3 helix = uCore + vec3(cos(ang) * r, y, sin(ang) * r);

          float fa = aSeed.x * 6.2831853 + uTime * 0.06 * (aSeed.w - 0.5);
          float fr = 0.6 + aSeed.z * 4.6;
          vec3 field = vec3(
            cos(fa) * fr,
            (aSeed.y - 0.5) * 9.0 + sin(uTime * 0.22 + aSeed.w * 6.2831853) * 0.25,
            sin(fa) * fr * 0.55 - 1.2
          );

          vec3 p = mix(helix, field, uField);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float twinkle = 0.6 + 0.4 * sin(uTime * (1.0 + aSeed.w * 3.0) + aSeed.x * 40.0);
          gl_PointSize = uSize * uPixelRatio * (0.5 + aSeed.w) * twinkle * (5.0 / max(0.5, -mv.z));
          vMint = step(0.82, aSeed.w);
          vAlpha = mix(1.0 - c * 0.45, 0.3, uField);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorA, uColorB;
        uniform float uOpacity;
        varying float vMint;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(mix(uColorA, uColorB, vMint) * a * vAlpha * uOpacity, a * vAlpha * uOpacity);
        }`,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    this.motes = new Points(geo, this.moteMat);
    this.motes.frustumCulled = false;
    this.scene.add(this.motes);
    this.disposables.push(geo, this.moteMat);
  }

  // ── Public API ───────────────────────────────────────────────────────

  setMode(mode: StageMode) {
    this.mode = mode;
    if (mode === 'exit') this.kick = 1;
  }

  /** Jump straight to the settled login composition (skip / intro disabled). */
  snapToLogin() {
    const t = this.loginTargets();
    Object.assign(this.s, t, { fade: 1 });
  }

  signal(signal: StageSignal) {
    if (signal === 'focus') this.focus = 1;
    if (signal === 'blur') this.focus = 0;
    // A constant-size impulse per keystroke: it never encodes what or how much was typed.
    if (signal === 'type') this.kick = Math.max(this.kick, 0.55);
    if (signal === 'error') this.flicker = 0.7;
    if (signal === 'success') this.setMode('exit');
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.disposables.forEach((d) => d.dispose());
    this.scene.environment = null;
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  // ── Loop ─────────────────────────────────────────────────────────────

  private start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.last = performance.now();
    this.perfT = 0;
    this.perfFrames = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  private onVisibility = () => {
    if (document.hidden) {
      this.running = false;
      cancelAnimationFrame(this.raf);
    } else {
      this.start();
    }
  };

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.running = false;
    this.opts.onFallback('context');
  };

  private onPointer = (e: PointerEvent) => {
    this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  };

  /** Small crystal in the top ~35% of the screen, motes as a dim drifting field. */
  private loginTargets() {
    const camZ = 5.6;
    const visibleH = 2 * Math.tan((35 * Math.PI) / 360) * camZ;
    return { scale: 0.27, y: visibleH * 0.3, camZ, burst: 0, field: 1, condense: 1, edge: 0.9, glow: 0.42, ring: 0.5, emissive: 0.16, motes: 0.75, ringScale: 1 };
  }

  private introState(t: number) {
    const s = this.s;
    s.y = 0;
    s.fade = 1;
    s.ringScale = 1;
    s.motes = clamp01(t / 0.6) * 0.9;
    if (t < INTRO.boot) {
      Object.assign(s, { condense: 0, scale: 0, edge: 0, glow: 0, ring: 0, burst: 0, field: 0, emissive: 0.1, camZ: 6.6 });
      return;
    }
    if (t < INTRO.forged) {
      const u = (t - INTRO.boot) / (INTRO.forged - INTRO.boot);
      const k = clamp01((u - 0.4) / 0.6);
      Object.assign(s, {
        condense: easeInOut(u), scale: 0.5 * easeOutBack(k), edge: k, glow: 0.15 + 0.45 * k, ring: k * 0.8,
        burst: 0, field: 0, emissive: 0.1 + 0.15 * k, camZ: 6.6 - 1.7 * easeOutCubic(u),
      });
      return;
    }
    if (t < INTRO.crack) {
      const p = Math.sin(((t - INTRO.forged) / (INTRO.crack - INTRO.forged)) * Math.PI);
      Object.assign(s, { condense: 1, scale: 0.5 * (1 + 0.1 * p), edge: 1, glow: 0.6 + 0.5 * p, ring: 0.8, burst: 0, field: 0, emissive: 0.25 + 1.5 * p, camZ: 4.9 });
      return;
    }
    const v = clamp01((t - INTRO.crack) / (INTRO.burst - INTRO.crack));
    const flash = Math.max(0, 1 - v / 0.22);
    Object.assign(s, {
      condense: 1, scale: 0.5, edge: 1 - 0.45 * v, glow: 0.5 + 2.2 * flash - 0.3 * v, ring: 0.8 * (1 - v), ringScale: 1 + 3.2 * easeOutCubic(v),
      burst: easeOutCubic(v), field: easeOutCubic(v), emissive: 0.3 + 2.2 * flash, camZ: 4.9 + 0.3 * v,
    });
  }

  private frame = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.elapsed += dt;
    this.monitor(dt);

    const s = this.s;
    const introT = (now - this.introStart) / 1000;

    if (this.mode === 'intro' && introT < INTRO.burst) {
      this.introState(introT);
    } else if (this.mode === 'exit' || (this.mode === 'intro' && introT >= INTRO.burst)) {
      // Session path (or post-login success): shards fly apart and the whole stage fades out.
      s.burst = damp(s.burst, 1, 5, dt);
      s.field = damp(s.field, 1, 4, dt);
      s.fade = damp(s.fade, 0, this.mode === 'exit' ? 5 : 4, dt);
      s.glow = damp(s.glow, 0.2, 5, dt);
    } else {
      const target = this.loginTargets();
      const lambda = 4.2;
      (Object.keys(target) as (keyof typeof target)[]).forEach((key) => {
        s[key] = damp(s[key], target[key], key === 'burst' ? 3.2 : lambda, dt);
      });
      s.fade = damp(s.fade, 1, 6, dt);
    }

    // Interaction layers (login): focus glow, keystroke kick, error flicker.
    this.kick = damp(this.kick, 0, 6, dt);
    this.flicker = Math.max(0, this.flicker - dt);
    const flick = this.flicker > 0 ? (Math.sin(this.elapsed * 95) > 0.1 ? 1 : 0.15) : 1;
    const focusGlow = this.mode === 'login' ? this.focus * 0.22 : 0;
    const errorHeat = this.flicker > 0 ? 1.4 : 0;

    this.pointer.x = damp(this.pointer.x, this.pointer.tx, 4, dt);
    this.pointer.y = damp(this.pointer.y, this.pointer.ty, 4, dt);

    this.spin += dt * (0.35 + this.focus * 0.5 + this.kick * 2.5);
    const scale = s.scale * (1 + this.kick * 0.08);
    this.core.scale.setScalar(Math.max(0.0001, scale));
    this.core.position.y = s.y;
    this.core.rotation.set(this.pointer.y * 0.25 + Math.sin(this.elapsed * 0.4) * 0.06, this.spin + this.pointer.x * 0.45, 0.08);
    this.ring.rotation.z = this.elapsed * 0.9;
    this.ring.scale.setScalar(s.ringScale);

    this.uBurst.value = s.burst;
    this.crystalMat.opacity = clamp01(s.edge * 1.4) * (1 - s.burst * 0.35) * s.fade;
    this.crystalMat.emissiveIntensity = (s.emissive + this.kick * 0.9 + errorHeat) * flick;
    this.edgeMat.uniforms.uOpacity.value = (s.edge + this.kick * 0.5 + focusGlow) * flick * s.fade;
    this.glowMat.opacity = clamp01((s.glow + focusGlow + this.kick * 0.5 + errorHeat * 0.4) * flick) * s.fade;
    this.ringMat.opacity = s.ring * flick * s.fade;
    this.keyLight.intensity = 4 + s.emissive * 6 + this.kick * 6;

    const u = this.moteMat.uniforms;
    u.uTime.value = this.elapsed;
    u.uCondense.value = s.condense;
    u.uField.value = s.field;
    u.uOpacity.value = s.motes * s.fade;

    this.camera.position.set(this.pointer.x * 0.12, -this.pointer.y * 0.08, s.camZ);
    this.camera.lookAt(0, s.y * 0.08, 0);
    this.renderer.render(this.scene, this.camera);
  };

  /** Hand-rolled PerformanceMonitor: degrade once, then ask for the CSS fallback if still < 30 fps. */
  private monitor(dt: number) {
    if (this.elapsed < 0.5) return;
    this.perfT += dt;
    this.perfFrames += 1;
    if (this.perfT < 0.5) return;
    const fps = this.perfFrames / this.perfT;
    this.perfT = 0;
    this.perfFrames = 0;

    if (fps < 45 && !this.degraded) {
      this.degraded = true;
      this.renderer.setPixelRatio(1);
      this.moteMat.uniforms.uPixelRatio.value = 1;
      this.motes.geometry.setDrawRange(0, Math.floor(this.moteCount / 2));
      this.resize();
      return;
    }
    this.lowSeconds = fps < 30 ? this.lowSeconds + 0.5 : 0;
    if (this.lowSeconds > 1 && this.opts.allowFallback) {
      this.running = false;
      this.opts.onFallback('fps');
    }
  }
}
