/**
 * ==========================================================================
 * ANTIGRAVITY DASHBOARD - COMPLETE CORE ENGINE (script.js)
 * Theme: Cyber Emerald Neon Green, Crystal-Clear 100% Visible Wallpapers,
 *        Synthesizer Audio Alarm Engine with Stop & Snooze Buttons,
 *        Gemini & GitHub Direct Launchers, Zen Mode
 * ==========================================================================
 */

// --- 1. INDEXEDDB HIGH-RES IMAGE STORAGE (Zero Quota Restriction) ---
const ImageDB = {
  dbName: 'AntigravityWallpaperDB',
  storeName: 'wallpapers',

  async getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async saveCustomImage(dataUrl) {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.put(dataUrl, 'custom_laptop_photo');
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB write error', e);
    }
  },

  async getCustomImage() {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get('custom_laptop_photo');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  async clearCustomImage() {
    try {
      const db = await this.getDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).delete('custom_laptop_photo');
    } catch (e) {}
  }
};

// --- 2. STORAGE SERVICE (chrome.storage.local with localStorage dual-write fallback) ---
const StorageService = {
  async get(keys) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    let result = {};

    // 1. Try reading from chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        result = await new Promise((resolve) => {
          chrome.storage.local.get(keyArray, (items) => {
            if (chrome.runtime && chrome.runtime.lastError) {
              console.warn('chrome.storage.local.get warning:', chrome.runtime.lastError.message);
              resolve({});
            } else {
              resolve(items || {});
            }
          });
        });
      } catch (err) {
        console.warn('chrome.storage.local.get failed, fallback to local', err);
        result = {};
      }
    }

    // 2. Fallback or fill in any missing values from localStorage
    keyArray.forEach((k) => {
      if (result[k] === undefined) {
        try {
          const val = localStorage.getItem(`antigravity_${k}`);
          if (val !== null && val !== undefined) {
            try {
              result[k] = JSON.parse(val);
            } catch (e) {
              result[k] = val;
            }
          }
        } catch (e) {}
      }
    });

    return result;
  },

  async set(items) {
    if (!items || typeof items !== 'object') return;

    // 1. Synchronously persist to localStorage as immediate local cache
    Object.entries(items).forEach(([k, v]) => {
      try {
        localStorage.setItem(`antigravity_${k}`, JSON.stringify(v));
      } catch (e) {
        // Ignore local quota errors
      }
    });

    // 2. Persist to chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        try {
          chrome.storage.local.set(items, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
              console.warn('chrome.storage.local.set warning:', chrome.runtime.lastError.message);
            }
            resolve();
          });
        } catch (err) {
          console.warn('chrome.storage.local.set exception:', err);
          resolve();
        }
      });
    }
  }
};

function getISOWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// --- 3. ALARM AUDIO SYNTHESIZER & CONTROLLER (Ringing Chimes & Instant Stop) ---
const AlarmSoundEngine = {
  audioCtx: null,
  masterGain: null,
  intervalId: null,
  activeNodes: [],
  isRinging: false,

  initContext() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    if (!this.masterGain && this.audioCtx) {
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.masterGain && this.audioCtx) {
      try {
        this.masterGain.gain.cancelScheduledValues(0);
        this.masterGain.gain.setValueAtTime(1, this.audioCtx.currentTime);
      } catch (e) {}
    }
  },

  start() {
    this.stop();
    this.initContext();
    this.isRinging = true;

    const playBurst = () => {
      if (!this.isRinging || !this.audioCtx || !this.masterGain) return;

      const now = this.audioCtx.currentTime;
      // High-clarity 4-tone rhythmic chime pattern
      const frequencies = [587.33, 783.99, 1046.50, 1318.51];

      frequencies.forEach((freq, index) => {
        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = index % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + index * 0.12);

          gain.gain.setValueAtTime(0.001, now + index * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.4, now + index * 0.12 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.28);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(now + index * 0.12);
          osc.stop(now + index * 0.12 + 0.3);

          this.activeNodes.push(osc);
          this.activeNodes.push(gain);

          osc.onended = () => {
            try { osc.disconnect(); } catch (e) {}
            try { gain.disconnect(); } catch (e) {}
            this.activeNodes = this.activeNodes.filter((n) => n !== osc && n !== gain);
          };
        } catch (e) {}
      });
    };

    playBurst();
    this.intervalId = setInterval(playBurst, 1200);
  },

  stop() {
    this.isRinging = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.masterGain && this.audioCtx) {
      try {
        this.masterGain.gain.cancelScheduledValues(0);
        this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      } catch (e) {}
    }

    this.activeNodes.forEach((node) => {
      try {
        if (typeof node.stop === 'function') node.stop();
        if (typeof node.disconnect === 'function') node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];

    if (this.audioCtx && this.audioCtx.state === 'running') {
      try {
        this.audioCtx.suspend().catch(() => {});
      } catch (e) {}
    }
  }
};

// Helper to resolve clean favicons
function resolveFaviconUrl(url, icon) {
  if (icon && icon.trim() !== '') {
    return icon;
  }
  if (!url) return '';
  const u = url.toLowerCase();
  if (u.includes('gemini.google.com')) {
    return 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg';
  }
  if (u.includes('github.com')) {
    return 'https://github.githubassets.com/favicons/favicon.svg';
  }
  if (u.includes('reddit.com')) {
    return 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png';
  }
  if (u.includes('chatgpt.com') || u.includes('openai.com')) {
    return 'https://chatgpt.com/favicon.ico';
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=128`;
}

// --- 4. INITIAL DEFAULT STATE ---
const DEFAULT_STATE = {
  activeView: 'view-home',
  boards: [
    {
      id: 'board-quick-links',
      title: 'Quick Links',
      type: 'bookmark',
      items: [
        { id: 'item-gemini', title: 'Gemini', url: 'https://gemini.google.com', icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg' },
        { id: 'item-1', title: 'GitHub', url: 'https://github.com', icon: 'https://github.githubassets.com/favicons/favicon.svg' },
        { id: 'item-3', title: 'Reddit', url: 'https://reddit.com', icon: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png' },
        { id: 'item-4', title: 'ChatGPT', url: 'https://chatgpt.com', icon: 'https://chatgpt.com/favicon.ico' }
      ]
    },
    {
      id: 'board-work',
      title: 'Work & Projects',
      type: 'task',
      items: [
        { id: 'item-5', title: 'Review pull requests', completed: false, tag: 'urgent' },
        { id: 'item-6', title: 'Prepare weekly sprint report', completed: true, tag: 'work' },
        { id: 'item-7', title: 'Refactor UI components', completed: false, tag: 'dev' }
      ]
    },
    {
      id: 'board-personal',
      title: 'Personal Goals',
      type: 'task',
      items: [
        { id: 'item-8', title: 'Read 20 pages of Sci-Fi book', completed: false, tag: 'daily' },
        { id: 'item-9', title: '30 min workout / stretching', completed: false, tag: 'health' }
      ]
    }
  ],
  reminders: [
    {
      id: 'rem-water',
      title: 'Stay Hydrated',
      message: 'Time to drink a fresh glass of water 💧',
      time: '14:00',
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6]
    }
  ],
  timerSettings: {
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15
  },
  customDateSettings: {
    userName: 'Explorer',
    clockFormat: '24h',
    showSeconds: true,
    dateFormat: 'full',
    customGreeting: '',
    countdownEventName: '',
    countdownEventDate: ''
  },
  weeklyFocusData: {
    targetHours: 20,
    weekStart: 'mon',
    dailyMinutes: { 0: 0, 1: 50, 2: 75, 3: 110, 4: 90, 5: 60, 6: 0 },
    lastWeekNumber: getISOWeekNumber(new Date())
  },
  backgroundSettings: {
    type: 'live',
    liveMode: 'antigravity',
    videoUrl: '',
    photoUrl: '',
    photoDataUrl: '',
    presetId: 'nebula',
    dimOpacity: 0,
    blurAmount: 0,
    videoAudioEnabled: false,
    videoVolume: 80
  },
  antigravityEnabled: true,
  searchEngine: 'google'
};

// --- 5. MULTI-MODE 3D LIVE WALLPAPER ENGINE ---
class AntigravityEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mode = 'antigravity';
    this.mouse = { x: null, y: null, targetX: 0, targetY: 0, radius: 150 };
    this.animationFrameId = null;
    this.tick = 0;

    this.particles = [];
    this.stars3D = [];
    this.polyhedra = [];
    this.matrixColumns = [];
    this.matrixChars = '0123456789ABCDEF$#@%&*+<>{}';

    this.colors = ['#00ff88', '#00e676', '#10b981', '#05df72', '#a3e635', '#34d399', '#6ee7b7'];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
      this.resetMode(this.mode);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.targetX = (e.clientX - this.width / 2) / (this.width / 2);
      this.mouse.targetY = (e.clientY - this.height / 2) / (this.height / 2);
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
      this.mouse.targetX = 0;
      this.mouse.targetY = 0;
    });

    this.resetMode(this.mode);
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  setMode(mode) {
    this.mode = mode;
    this.resetMode(mode);
  }

  resetMode(mode) {
    this.tick = 0;
    if (mode === 'antigravity') {
      this.particles = [];
      for (let i = 0; i < 80; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 2.5 + 1,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          vx: (Math.random() - 0.5) * 0.6,
          vy: -(Math.random() * 0.7 + 0.2),
          alpha: Math.random() * 0.7 + 0.3,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          angle: Math.random() * Math.PI * 2
        });
      }
    } else if (mode === 'hyperspace') {
      this.stars3D = [];
      for (let i = 0; i < 450; i++) {
        this.stars3D.push({
          x: (Math.random() - 0.5) * 2000,
          y: (Math.random() - 0.5) * 2000,
          z: Math.random() * 1500 + 1,
          pz: 1500,
          color: this.colors[Math.floor(Math.random() * this.colors.length)]
        });
      }
    } else if (mode === 'polyhedra') {
      this.polyhedra = [];
      for (let i = 0; i < 9; i++) {
        this.polyhedra.push({
          x: (Math.random() - 0.5) * (this.width * 0.8),
          y: (Math.random() - 0.5) * (this.height * 0.8),
          z: Math.random() * 400 + 200,
          size: Math.random() * 38 + 32,
          rotX: Math.random() * Math.PI,
          rotY: Math.random() * Math.PI,
          rotZ: Math.random() * Math.PI,
          speedX: (Math.random() - 0.5) * 0.015,
          speedY: (Math.random() - 0.5) * 0.02,
          speedZ: (Math.random() - 0.5) * 0.01,
          driftX: (Math.random() - 0.5) * 0.5,
          driftY: (Math.random() - 0.5) * 0.5,
          color: this.colors[i % this.colors.length]
        });
      }
    } else if (mode === 'matrix_rain') {
      const colCount = Math.floor(this.width / 18);
      this.matrixColumns = [];
      for (let i = 0; i < colCount; i++) {
        this.matrixColumns.push({
          x: i * 18,
          y: Math.random() * -1000,
          speed: Math.random() * 3 + 2,
          chars: Array.from({ length: 22 }, () => this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)])
        });
      }
    }
  }

  animate() {
    this.tick++;
    this.ctx.clearRect(0, 0, this.width, this.height);

    switch (this.mode) {
      case 'antigravity':
        this.renderAntigravity();
        break;
      case 'hyperspace':
        this.renderHyperspace();
        break;
      case 'synthwave':
        this.renderSynthwave();
        break;
      case 'polyhedra':
        this.renderPolyhedra();
        break;
      case 'matrix_rain':
        this.renderMatrixRain();
        break;
      case 'aurora':
        this.renderAurora();
        break;
      default:
        this.renderAntigravity();
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  renderAntigravity() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.pulseSpeed;

      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.x -= Math.cos(angle) * force * 5;
          p.y -= Math.sin(angle) * force * 5;
        }
      }

      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;

      const currentAlpha = p.alpha + Math.sin(p.angle) * 0.2;
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0.1, Math.min(1, currentAlpha));
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 14;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 110) {
          this.ctx.save();
          this.ctx.globalAlpha = (1 - dist / 110) * 0.24;
          this.ctx.strokeStyle = p.color;
          this.ctx.lineWidth = 0.8;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    }
  }

  renderHyperspace() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const speed = 14 + Math.hypot(this.mouse.targetX, this.mouse.targetY) * 10;
    const fov = 360;

    const steerX = this.mouse.targetX * 240;
    const steerY = this.mouse.targetY * 240;

    for (let i = 0; i < this.stars3D.length; i++) {
      const star = this.stars3D[i];
      star.pz = star.z;
      star.z -= speed;

      if (star.z <= 0) {
        star.z = 1500;
        star.pz = 1500;
        star.x = (Math.random() - 0.5) * 2000;
        star.y = (Math.random() - 0.5) * 2000;
      }

      const sx = cx + ((star.x - steerX) / star.z) * fov;
      const sy = cy + ((star.y - steerY) / star.z) * fov;
      const px = cx + ((star.x - steerX) / star.pz) * fov;
      const py = cy + ((star.y - steerY) / star.pz) * fov;

      if (sx >= 0 && sx <= this.width && sy >= 0 && sy <= this.height) {
        const size = Math.max(0.5, (1 - star.z / 1500) * 3.5);
        const alpha = Math.min(1, Math.max(0.2, (1 - star.z / 1500) * 1.3));

        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = star.color;
        this.ctx.lineWidth = size;
        this.ctx.beginPath();
        this.ctx.moveTo(px, py);
        this.ctx.lineTo(sx, sy);
        this.ctx.restore();
      }
    }
  }

  renderSynthwave() {
    const horizonY = this.height * 0.45;
    const cx = this.width / 2;

    this.ctx.save();
    const sunRadius = 85;
    const sunGrad = this.ctx.createRadialGradient(cx, horizonY - 15, 10, cx, horizonY - 15, sunRadius);
    sunGrad.addColorStop(0, '#a3e635');
    sunGrad.addColorStop(0.5, '#00ff88');
    sunGrad.addColorStop(1, 'rgba(5, 223, 114, 0)');

    this.ctx.fillStyle = sunGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, horizonY - 15, sunRadius, Math.PI, 0);
    this.ctx.fill();
    this.ctx.restore();

    const cols = 32;
    const rows = 20;
    const spacing = 65;
    const speed = (this.tick * 1.6) % spacing;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.45)';
    this.ctx.lineWidth = 1.2;

    for (let c = -cols / 2; c <= cols / 2; c++) {
      const xStart = cx + (c * (this.width / 14));
      this.ctx.beginPath();
      this.ctx.moveTo(cx + c * 2, horizonY);
      this.ctx.lineTo(xStart, this.height);
      this.ctx.stroke();
    }

    for (let r = 1; r < rows; r++) {
      const py = horizonY + (this.height - horizonY) * Math.pow(r / rows, 2.2);
      this.ctx.strokeStyle = `rgba(5, 223, 114, ${Math.min(0.85, r / rows)})`;
      this.ctx.beginPath();
      this.ctx.moveTo(0, py);
      this.ctx.lineTo(this.width, py);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  renderPolyhedra() {
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.polyhedra.forEach((poly) => {
      poly.rotX += poly.speedX;
      poly.rotY += poly.speedY;
      poly.rotZ += poly.speedZ;

      poly.x += poly.driftX;
      poly.y += poly.driftY;

      if (Math.abs(poly.x) > this.width * 0.45) poly.driftX *= -1;
      if (Math.abs(poly.y) > this.height * 0.45) poly.driftY *= -1;

      const s = poly.size;
      const vertices = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
      ];

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];

      const projected = vertices.map(([x, y, z]) => {
        let y1 = y * Math.cos(poly.rotX) - z * Math.sin(poly.rotX);
        let z1 = y * Math.sin(poly.rotX) + z * Math.cos(poly.rotX);
        let x2 = x * Math.cos(poly.rotY) + z1 * Math.sin(poly.rotY);
        let z2 = -x * Math.sin(poly.rotY) + z1 * Math.cos(poly.rotY);
        let x3 = x2 * Math.cos(poly.rotZ) - y1 * Math.sin(poly.rotZ);
        let y3 = x2 * Math.sin(poly.rotZ) + y1 * Math.cos(poly.rotZ);

        const fov = 400;
        const screenX = cx + poly.x + (x3 * fov) / (fov + poly.z + z2);
        const screenY = cy + poly.y + (y3 * fov) / (fov + poly.z + z2);
        return [screenX, screenY];
      });

      this.ctx.save();
      this.ctx.strokeStyle = poly.color;
      this.ctx.lineWidth = 1.4;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = poly.color;
      this.ctx.globalAlpha = 0.65;

      edges.forEach(([i1, i2]) => {
        this.ctx.beginPath();
        this.ctx.moveTo(projected[i1][0], projected[i1][1]);
        this.ctx.lineTo(projected[i2][0], projected[i2][1]);
        this.ctx.stroke();
      });
      this.ctx.restore();
    });
  }

  renderMatrixRain() {
    this.ctx.save();
    this.ctx.font = '14px "JetBrains Mono", monospace';

    this.matrixColumns.forEach((col) => {
      col.y += col.speed;
      if (col.y > this.height + 400) {
        col.y = -350;
      }

      col.chars.forEach((char, idx) => {
        const charY = col.y + idx * 18;
        if (charY >= 0 && charY <= this.height) {
          const isLead = idx === col.chars.length - 1;
          this.ctx.fillStyle = isLead ? '#ffffff' : idx > col.chars.length - 4 ? '#00ff88' : 'rgba(0, 255, 136, 0.45)';
          this.ctx.fillText(char, col.x, charY);
        }
      });
    });
    this.ctx.restore();
  }

  renderAurora() {
    this.ctx.save();
    const t = this.tick * 0.012;

    for (let layer = 0; layer < 3; layer++) {
      const grad = this.ctx.createLinearGradient(0, 0, this.width, this.height);
      grad.addColorStop(0, layer === 0 ? 'rgba(0, 255, 136, 0.18)' : 'rgba(5, 223, 114, 0.14)');
      grad.addColorStop(1, layer === 1 ? 'rgba(163, 230, 53, 0.16)' : 'rgba(0, 255, 136, 0.1)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.height);

      for (let x = 0; x <= this.width; x += 40) {
        const y = (this.height * 0.4) +
          Math.sin(x * 0.003 + t + layer) * 90 +
          Math.cos(x * 0.006 - t * 0.8) * 60;
        this.ctx.lineTo(x, y);
      }

      this.ctx.lineTo(this.width, this.height);
      this.ctx.closePath();
      this.ctx.fill();
    }
    this.ctx.restore();
  }
}

// --- 6. WALLPAPER & BACKGROUND MANAGER (Audio, Video Voice & IndexedDB Engine) ---
class WallpaperManager {
  constructor(app) {
    this.app = app;
    this.bgLayer = document.getElementById('custom-bg-image');
    this.videoLayer = document.getElementById('custom-bg-video');
    this.canvasEl = document.getElementById('antigravity-canvas');
    this.overlayEl = document.getElementById('bg-overlay');
    this.dropzoneEl = document.getElementById('wallpaper-dropzone');
    this.headerSoundBtn = document.getElementById('btn-toggle-video-sound');
    this.soundIconUnmuted = document.getElementById('video-sound-icon-unmuted');
    this.soundIconMuted = document.getElementById('video-sound-icon-muted');
    this.audioToggle = document.getElementById('setting-video-audio-toggle');
    this.volumeSlider = document.getElementById('setting-video-volume');
    this.volumeDisplay = document.getElementById('video-volume-display');

    this.settings = { ...DEFAULT_STATE.backgroundSettings };

    this.bindEvents();
    this.bindDragAndDrop();
  }

  async init(savedSettings) {
    if (savedSettings) {
      this.settings = { ...this.settings, ...savedSettings };
    }

    if (this.settings.type === 'photo' && (!this.settings.photoUrl || this.settings.presetId === 'custom')) {
      const dbImg = await ImageDB.getCustomImage();
      if (dbImg) {
        this.settings.photoDataUrl = dbImg;
      }
    }

    this.apply();
    this.updateLaptopPreviewBox();
  }

  bindEvents() {
    const openBtn = document.getElementById('btn-open-bg-studio');
    openBtn?.addEventListener('click', () => {
      this.syncModalUI();
      openModal('modal-bg-studio');
    });

    document.querySelectorAll('.studio-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.studio-tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.studio-tab-content').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab)?.classList.add('active');
      });
    });

    // 1. Live 3D wallpaper selection
    document.querySelectorAll('[data-live-mode]').forEach((card) => {
      card.addEventListener('click', () => {
        const mode = card.getAttribute('data-live-mode');
        this.settings.type = 'live';
        this.settings.liveMode = mode;
        this.save();
        this.apply();
        this.syncModalUI();
        showToast(`🌌 Live 3D Wallpaper: ${card.querySelector('h4')?.textContent || mode}`);
      });
    });

    // 2. Video Live wallpaper preset
    document.querySelectorAll('[data-video-preset]').forEach((card) => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-video-url');
        this.settings.type = 'video';
        this.settings.videoUrl = url;
        this.save();
        this.apply();
        this.syncModalUI();
        showToast(`🎬 Video Live Wallpaper: ${card.querySelector('h4')?.textContent}`);
      });
    });

    // Video URL input
    document.getElementById('btn-apply-video-url')?.addEventListener('click', () => {
      const url = document.getElementById('bg-video-url-input')?.value.trim();
      if (url) {
        this.settings.type = 'video';
        this.settings.videoUrl = url;
        this.save();
        this.apply();
        this.syncModalUI();
        showToast('🎬 Custom Video Wallpaper Applied!');
      }
    });

    // Local Video upload from Laptop
    document.getElementById('bg-video-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const videoBlobUrl = URL.createObjectURL(file);
      this.settings.type = 'video';
      this.settings.videoUrl = videoBlobUrl;
      this.save();
      this.apply();
      this.syncModalUI();
      showToast('🎬 Local Video Live Wallpaper Loaded!');
    });

    // Video Sound & Voice Controls
    this.headerSoundBtn?.addEventListener('click', () => {
      this.toggleVideoAudio();
    });

    this.audioToggle?.addEventListener('change', (e) => {
      this.setVideoAudio(e.target.checked);
    });

    this.volumeSlider?.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value);
      this.settings.videoVolume = vol;
      if (this.volumeDisplay) this.volumeDisplay.textContent = `${vol}%`;
      if (this.videoLayer) this.videoLayer.volume = vol / 100;
      this.save();
    });

    // 3. Photo preset selection
    document.querySelectorAll('[data-photo-preset]').forEach((card) => {
      card.addEventListener('click', () => {
        const preset = card.getAttribute('data-photo-preset');
        const url = card.getAttribute('data-url');
        this.settings.type = 'photo';
        this.settings.presetId = preset;
        this.settings.photoUrl = url;
        this.settings.photoDataUrl = '';
        this.save();
        this.apply();
        this.syncModalUI();
        this.updateLaptopPreviewBox();
        showToast(`📸 Photo Wallpaper: ${card.querySelector('h4')?.textContent}`);
      });
    });

    // 4. Laptop File Upload (Photo)
    const fileInput = document.getElementById('bg-file-input');
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      this.handleLaptopImageFile(file);
    });

    // Clear Laptop Photo Button
    document.getElementById('btn-clear-laptop-photo')?.addEventListener('click', async () => {
      await ImageDB.clearCustomImage();
      this.settings.photoDataUrl = '';
      this.settings.type = 'live';
      this.settings.liveMode = 'antigravity';
      this.save();
      this.apply();
      this.syncModalUI();
      this.updateLaptopPreviewBox();
      showToast('🗑️ Laptop Photo Removed');
    });

    // 5. Image URL input
    document.getElementById('btn-apply-url-bg')?.addEventListener('click', () => {
      const url = document.getElementById('bg-url-input')?.value.trim();
      if (url) {
        this.settings.type = 'photo';
        this.settings.photoUrl = url;
        this.settings.photoDataUrl = '';
        this.settings.presetId = 'custom';
        this.save();
        this.apply();
        this.syncModalUI();
        this.updateLaptopPreviewBox();
        showToast('📸 Web Photo Applied (100% Clear)!');
      }
    });

    // 6. Sliders (Dim & Blur)
    const dimSlider = document.getElementById('setting-bg-dim');
    const dimDisplay = document.getElementById('dim-value-display');
    dimSlider?.addEventListener('input', (e) => {
      this.settings.dimOpacity = parseInt(e.target.value);
      if (dimDisplay) dimDisplay.textContent = `${this.settings.dimOpacity}%`;
      this.applyAtmosphere();
      this.save();
    });

    const blurSlider = document.getElementById('setting-bg-blur');
    const blurDisplay = document.getElementById('blur-value-display');
    blurSlider?.addEventListener('input', (e) => {
      this.settings.blurAmount = parseInt(e.target.value);
      if (blurDisplay) blurDisplay.textContent = `${this.settings.blurAmount}px`;
      this.applyAtmosphere();
      this.save();
    });
  }

  toggleVideoAudio() {
    const newState = !this.settings.videoAudioEnabled;
    this.setVideoAudio(newState);
  }

  setVideoAudio(enabled) {
    this.settings.videoAudioEnabled = enabled;
    if (this.videoLayer) {
      this.videoLayer.muted = !enabled;
      this.videoLayer.volume = (this.settings.videoVolume || 80) / 100;
      if (enabled) {
        this.videoLayer.play().catch(() => {});
      }
    }
    this.updateAudioUI();
    this.save();
    showToast(enabled ? '🔊 Video Voice / Audio Enabled' : '🔇 Video Audio Muted');
  }

  updateAudioUI() {
    const isUnmuted = this.settings.videoAudioEnabled;
    if (this.soundIconUnmuted) this.soundIconUnmuted.style.display = isUnmuted ? 'block' : 'none';
    if (this.soundIconMuted) this.soundIconMuted.style.display = isUnmuted ? 'none' : 'block';
    if (this.audioToggle) this.audioToggle.checked = isUnmuted;
  }

  // Fullscreen Drag & Drop from Laptop
  bindDragAndDrop() {
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
      if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        dragCounter++;
        this.dropzoneEl?.classList.add('drag-active');
      }
    });

    window.addEventListener('dragleave', () => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        this.dropzoneEl?.classList.remove('drag-active');
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      this.dropzoneEl?.classList.remove('drag-active');

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          this.handleLaptopImageFile(file);
        } else if (file.type.startsWith('video/')) {
          const videoBlobUrl = URL.createObjectURL(file);
          this.settings.type = 'video';
          this.settings.videoUrl = videoBlobUrl;
          this.save();
          this.apply();
          this.syncModalUI();
          showToast('🎬 Laptop Video Live Wallpaper Set!');
        }
      }
    });
  }

  handleLaptopImageFile(file) {
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      this.settings.type = 'photo';
      this.settings.photoDataUrl = dataUrl;
      this.settings.photoUrl = '';
      this.settings.presetId = 'custom';

      await ImageDB.saveCustomImage(dataUrl);

      this.save();
      this.apply();
      this.syncModalUI();
      this.updateLaptopPreviewBox();
      showToast('🖼️ Laptop Wallpaper Loaded (100% Crystal Clear)!');
    };
    reader.readAsDataURL(file);
  }

  updateLaptopPreviewBox() {
    const previewBox = document.getElementById('active-laptop-photo-box');
    const thumbImg = document.getElementById('active-laptop-thumb');
    const imgSource = this.settings.photoDataUrl || (this.settings.type === 'photo' ? this.settings.photoUrl : '');

    if (previewBox && thumbImg) {
      if (this.settings.type === 'photo' && imgSource) {
        thumbImg.src = imgSource;
        previewBox.style.display = 'flex';
      } else {
        previewBox.style.display = 'none';
      }
    }
  }

  apply() {
    this.applyAtmosphere();

    if (this.settings.type === 'live') {
      document.body.classList.remove('has-photo-bg', 'has-video-bg');
      document.body.style.backgroundImage = 'none';

      if (this.headerSoundBtn) this.headerSoundBtn.style.display = 'none';

      if (this.bgLayer) {
        this.bgLayer.classList.remove('active');
        this.bgLayer.style.display = 'none';
        this.bgLayer.style.backgroundImage = 'none';
      }
      if (this.videoLayer) {
        this.videoLayer.pause();
        this.videoLayer.muted = true;
        this.videoLayer.classList.remove('active');
        this.videoLayer.style.display = 'none';
      }

      if (this.canvasEl) {
        this.canvasEl.style.display = 'block';
        this.canvasEl.style.opacity = '1';
        this.canvasEl.style.visibility = 'visible';
        this.app.canvasEngine.setMode(this.settings.liveMode || 'antigravity');
      }
    } else if (this.settings.type === 'video') {
      document.body.classList.add('has-video-bg');
      document.body.classList.remove('has-photo-bg');
      document.body.style.backgroundImage = 'none';

      if (this.headerSoundBtn) this.headerSoundBtn.style.display = 'flex';

      if (this.canvasEl) {
        this.canvasEl.style.display = 'none';
        this.canvasEl.style.opacity = '0';
      }
      if (this.bgLayer) {
        this.bgLayer.classList.remove('active');
        this.bgLayer.style.display = 'none';
      }

      if (this.videoLayer && this.settings.videoUrl) {
        this.videoLayer.src = this.settings.videoUrl;
        this.videoLayer.style.display = 'block';
        this.videoLayer.classList.add('active');

        this.videoLayer.muted = !this.settings.videoAudioEnabled;
        this.videoLayer.volume = (this.settings.videoVolume || 80) / 100;
        this.updateAudioUI();

        this.videoLayer.play().catch((e) => {
          console.log('Autoplay handled', e);
        });
      }
    } else {
      // Photo Wallpaper
      document.body.classList.add('has-photo-bg');
      document.body.classList.remove('has-video-bg');

      if (this.headerSoundBtn) this.headerSoundBtn.style.display = 'none';

      if (this.canvasEl) {
        this.canvasEl.style.display = 'none';
        this.canvasEl.style.opacity = '0';
      }
      if (this.videoLayer) {
        this.videoLayer.pause();
        this.videoLayer.muted = true;
        this.videoLayer.classList.remove('active');
        this.videoLayer.style.display = 'none';
      }

      const imgSource = this.settings.photoDataUrl || this.settings.photoUrl;
      if (imgSource) {
        if (this.bgLayer) {
          this.bgLayer.style.backgroundImage = `url("${imgSource}")`;
          this.bgLayer.style.display = 'block';
          this.bgLayer.classList.add('active');
        }
        document.body.style.backgroundImage = `url("${imgSource}")`;
      } else {
        if (this.bgLayer) {
          this.bgLayer.style.backgroundImage = 'none';
          this.bgLayer.classList.remove('active');
        }
        document.body.style.backgroundImage = 'none';
      }
    }
  }

  applyAtmosphere() {
    const dim = (this.settings.dimOpacity || 0) / 100;
    const blur = this.settings.blurAmount || 0;

    if (this.overlayEl) {
      if (dim > 0) {
        this.overlayEl.style.display = 'block';
        this.overlayEl.style.background = `rgba(4, 8, 6, ${dim})`;
      } else {
        this.overlayEl.style.display = 'none';
        this.overlayEl.style.background = 'transparent';
      }
    }

    const filterVal = blur > 0 ? `blur(${blur}px)` : 'none';
    if (this.bgLayer) this.bgLayer.style.filter = filterVal;
    if (this.videoLayer) this.videoLayer.style.filter = filterVal;
  }

  syncModalUI() {
    document.querySelectorAll('.wallpaper-preset-card').forEach((c) => c.classList.remove('active'));

    if (this.settings.type === 'live') {
      const activeCard = document.querySelector(`[data-live-mode="${this.settings.liveMode}"]`);
      activeCard?.classList.add('active');
    } else if (this.settings.type === 'video') {
      const activeCard = document.querySelector(`[data-video-url="${this.settings.videoUrl}"]`);
      activeCard?.classList.add('active');
    } else {
      const activePreset = document.querySelector(`[data-photo-preset="${this.settings.presetId}"]`);
      activePreset?.classList.add('active');
    }

    const dimSlider = document.getElementById('setting-bg-dim');
    const dimDisplay = document.getElementById('dim-value-display');
    if (dimSlider) dimSlider.value = this.settings.dimOpacity || 0;
    if (dimDisplay) dimDisplay.textContent = `${this.settings.dimOpacity || 0}%`;

    const blurSlider = document.getElementById('setting-bg-blur');
    const blurDisplay = document.getElementById('blur-value-display');
    if (blurSlider) blurSlider.value = this.settings.blurAmount || 0;
    if (blurDisplay) blurDisplay.textContent = `${this.settings.blurAmount || 0}px`;

    if (this.audioToggle) this.audioToggle.checked = !!this.settings.videoAudioEnabled;
    if (this.volumeSlider) this.volumeSlider.value = this.settings.videoVolume || 80;
    if (this.volumeDisplay) this.volumeDisplay.textContent = `${this.settings.videoVolume || 80}%`;
  }

  save() {
    const toSave = { ...this.settings };
    if (toSave.photoDataUrl && toSave.photoDataUrl.length > 500000) {
      toSave.photoDataUrl = 'stored_in_idb';
    }
    StorageService.set({ backgroundSettings: toSave });
  }
}

// --- 7. WEEKLY FOCUS & SPRINT TIMER ENGINE ---
class WeeklyTimerTracker {
  constructor(app) {
    this.app = app;
    this.data = {
      targetHours: 20,
      weekStart: 'mon',
      dailyMinutes: { 0: 0, 1: 50, 2: 75, 3: 110, 4: 90, 5: 60, 6: 0 },
      lastWeekNumber: getISOWeekNumber(new Date())
    };

    this.currentHoursEl = document.getElementById('weekly-hours-current');
    this.targetHoursEl = document.getElementById('weekly-hours-target');
    this.percentBadgeEl = document.getElementById('weekly-percent-badge');
    this.progressBarEl = document.getElementById('weekly-progress-bar');
    this.chartContainer = document.getElementById('weekly-days-chart');

    this.bindEvents();
  }

  init(savedData) {
    if (savedData) {
      this.data = { ...this.data, ...savedData };
    }

    const currentWeek = getISOWeekNumber(new Date());
    if (this.data.lastWeekNumber !== currentWeek) {
      this.data.dailyMinutes = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      this.data.lastWeekNumber = currentWeek;
      this.save();
    }

    this.render();
  }

  bindEvents() {
    const settingsBtn = document.getElementById('btn-weekly-settings');
    const form = document.getElementById('form-weekly-settings');
    const manualAddBtn = document.getElementById('btn-manual-log-time');
    const resetBtn = document.getElementById('btn-reset-weekly-data');

    settingsBtn?.addEventListener('click', () => {
      document.getElementById('setting-weekly-target-hours').value = this.data.targetHours;
      document.getElementById('setting-weekly-start-day').value = this.data.weekStart || 'mon';
      openModal('modal-weekly-timer-settings');
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.data.targetHours = parseFloat(document.getElementById('setting-weekly-target-hours').value) || 20;
      this.data.weekStart = document.getElementById('setting-weekly-start-day').value;
      this.save();
      this.render();
      closeModal('modal-weekly-timer-settings');
    });

    manualAddBtn?.addEventListener('click', () => {
      const input = document.getElementById('setting-manual-add-minutes');
      const mins = parseInt(input.value);
      if (mins && mins > 0) {
        this.addFocusMinutes(mins);
        input.value = '';
        closeModal('modal-weekly-timer-settings');
      }
    });

    resetBtn?.addEventListener('click', () => {
      if (confirm('Reset focus minutes for this week?')) {
        this.data.dailyMinutes = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        this.save();
        this.render();
        closeModal('modal-weekly-timer-settings');
      }
    });
  }

  addFocusMinutes(minutes) {
    const today = new Date().getDay();
    const current = this.data.dailyMinutes[today] || 0;
    this.data.dailyMinutes[today] = current + minutes;
    this.save();
    this.render();
    this.app.updateHomeGlanceBar();
  }

  render() {
    const targetHours = this.data.targetHours || 20;
    const totalMinutes = Object.values(this.data.dailyMinutes).reduce((a, b) => a + (Number(b) || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const percent = Math.min(100, Math.round((totalHours / targetHours) * 100));

    if (this.currentHoursEl) this.currentHoursEl.textContent = totalHours;
    if (this.targetHoursEl) this.targetHoursEl.textContent = targetHours;
    if (this.percentBadgeEl) this.percentBadgeEl.textContent = `${percent}%`;
    if (this.progressBarEl) this.progressBarEl.style.width = `${percent}%`;

    if (this.chartContainer) {
      this.chartContainer.innerHTML = '';
      const isMonStart = this.data.weekStart !== 'sun';
      const dayOrder = isMonStart ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
      const dayLabels = { 0: 'Su', 1: 'Mo', 2: 'Tu', 3: 'We', 4: 'Th', 5: 'Fr', 6: 'Sa' };

      const today = new Date().getDay();
      const maxDailyTargetMins = (targetHours / 7) * 60;

      dayOrder.forEach((dayNum) => {
        const mins = this.data.dailyMinutes[dayNum] || 0;
        const barPercent = Math.min(100, Math.max(6, Math.round((mins / maxDailyTargetMins) * 100)));

        const col = document.createElement('div');
        col.className = `day-bar-col ${dayNum === today ? 'today' : ''}`;
        col.title = `${dayLabels[dayNum]}: ${mins} mins focus`;

        col.innerHTML = `
          <div class="day-bar-track">
            <div class="day-bar-fill" style="height: ${mins > 0 ? barPercent : 6}%;"></div>
          </div>
          <span class="day-label">${dayLabels[dayNum]}</span>
        `;
        this.chartContainer.appendChild(col);
      });
    }
  }

  save() {
    StorageService.set({ weeklyFocusData: this.data });
  }
}

// --- 8. POMODORO FOCUS CONTROLLER ---
class PomodoroTimer {
  constructor(app) {
    this.app = app;
    this.mode = 'work';
    this.isRunning = false;
    this.timeLeft = 25 * 60;
    this.totalDuration = 25 * 60;
    this.timerInterval = null;
    this.settings = { workDuration: 25, shortBreak: 5, longBreak: 15 };

    this.displayEl = document.getElementById('timer-display');
    this.progressRing = document.getElementById('timer-progress-ring');
    this.toggleBtn = document.getElementById('btn-timer-toggle');
    this.toggleLabel = document.getElementById('timer-toggle-label');
    this.resetBtn = document.getElementById('btn-timer-reset');
    this.settingsBtn = document.getElementById('btn-timer-settings');
    this.modePills = document.querySelectorAll('.mode-pill');

    this.circumference = 2 * Math.PI * 56;
    if (this.progressRing) {
      this.progressRing.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
      this.progressRing.style.strokeDashoffset = 0;
    }

    this.bindEvents();
  }

  init(savedSettings) {
    if (savedSettings) {
      this.settings = { ...this.settings, ...savedSettings };
    }
    this.setMode('work');
  }

  bindEvents() {
    this.toggleBtn?.addEventListener('click', () => this.toggle());
    this.resetBtn?.addEventListener('click', () => this.reset());
    this.settingsBtn?.addEventListener('click', () => {
      document.getElementById('setting-work-duration').value = this.settings.workDuration;
      document.getElementById('setting-short-break').value = this.settings.shortBreak;
      document.getElementById('setting-long-break').value = this.settings.longBreak;
      openModal('modal-timer-settings');
    });

    this.modePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        this.setMode(pill.dataset.mode);
      });
    });

    document.getElementById('form-timer-settings')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.settings.workDuration = parseInt(document.getElementById('setting-work-duration').value) || 25;
      this.settings.shortBreak = parseInt(document.getElementById('setting-short-break').value) || 5;
      this.settings.longBreak = parseInt(document.getElementById('setting-long-break').value) || 15;

      StorageService.set({ timerSettings: this.settings });
      closeModal('modal-timer-settings');
      this.setMode(this.mode);
    });
  }

  setMode(mode) {
    this.pause();
    this.mode = mode;

    this.modePills.forEach((p) => p.classList.toggle('active', p.dataset.mode === mode));

    let minutes = this.settings.workDuration;
    if (mode === 'shortBreak') minutes = this.settings.shortBreak;
    if (mode === 'longBreak') minutes = this.settings.longBreak;

    this.totalDuration = minutes * 60;
    this.timeLeft = this.totalDuration;
    this.updateDisplay();
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.toggleLabel) this.toggleLabel.textContent = 'Pause Session';
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'START_POMODORO_ALARM',
        minutes: this.timeLeft / 60
      });
    }

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();

      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    if (this.toggleLabel) this.toggleLabel.textContent = 'Start Session';
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'CANCEL_POMODORO_ALARM' });
    }
  }

  reset() {
    this.pause();
    this.timeLeft = this.totalDuration;
    this.updateDisplay();
  }

  complete() {
    this.pause();

    if (this.mode === 'work') {
      this.app.weeklyTracker.addFocusMinutes(this.settings.workDuration);
    }

    // Trigger Ringing Alarm & Banner with Stop Button
    this.app.triggerAlarmRing({
      title: this.mode === 'work' ? '🍅 Focus Session Complete!' : '☕ Break Finished!',
      message: this.mode === 'work' ? 'Time for a mindful break and stretch.' : 'Break is over! Time to get back to focus.',
      time: 'Interval Done'
    });

    if (this.mode === 'work') {
      this.setMode('shortBreak');
    } else {
      this.setMode('work');
    }
  }

  updateDisplay() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    const str = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (this.displayEl) this.displayEl.textContent = str;

    const glanceTimer = document.getElementById('glance-timer-display');
    if (glanceTimer) glanceTimer.textContent = str;

    if (this.progressRing) {
      const progress = (this.totalDuration - this.timeLeft) / this.totalDuration;
      const offset = this.circumference - progress * this.circumference;
      this.progressRing.style.strokeDashoffset = offset;
    }
  }
}

// --- 9. ANTIGRAVITY APP CONTROLLER ---
class AntigravityApp {
  constructor() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.canvasEngine = null;
    this.wallpaperManager = null;
    this.weeklyTracker = null;
    this.timer = null;
    this.lastTriggeredMinute = null;

    this.init();
  }

  async init() {
    this.canvasEngine = new AntigravityEngine('antigravity-canvas');
    this.wallpaperManager = new WallpaperManager(this);
    this.weeklyTracker = new WeeklyTimerTracker(this);
    this.timer = new PomodoroTimer(this);

    const stored = await StorageService.get([
      'activeView',
      'boards',
      'reminders',
      'timerSettings',
      'customDateSettings',
      'weeklyFocusData',
      'backgroundSettings',
      'antigravityEnabled',
      'searchEngine'
    ]);

    if (stored.activeView) this.state.activeView = stored.activeView;

    // Safely load boards and ensure user links are never overwritten or filtered out
    if (stored.boards && Array.isArray(stored.boards) && stored.boards.length > 0) {
      this.state.boards = stored.boards;
    } else {
      // First run: persist initial default boards to storage so storage is never empty
      await StorageService.set({ boards: this.state.boards });
    }

    if (stored.reminders) this.state.reminders = stored.reminders;
    if (stored.timerSettings) this.state.timerSettings = stored.timerSettings;
    if (stored.customDateSettings) this.state.customDateSettings = { ...this.state.customDateSettings, ...stored.customDateSettings };
    if (stored.weeklyFocusData) this.state.weeklyFocusData = stored.weeklyFocusData;
    if (stored.backgroundSettings) {
      this.state.backgroundSettings = {
        ...this.state.backgroundSettings,
        ...stored.backgroundSettings,
        dimOpacity: stored.backgroundSettings.dimOpacity ?? 0,
        blurAmount: stored.backgroundSettings.blurAmount ?? 0,
        videoAudioEnabled: stored.backgroundSettings.videoAudioEnabled ?? false,
        videoVolume: stored.backgroundSettings.videoVolume ?? 80
      };
    }
    if (stored.antigravityEnabled !== undefined) this.state.antigravityEnabled = stored.antigravityEnabled;
    if (stored.searchEngine) this.state.searchEngine = stored.searchEngine;

    await this.wallpaperManager.init(this.state.backgroundSettings);
    this.timer.init(this.state.timerSettings);
    this.weeklyTracker.init(this.state.weeklyFocusData);

    this.setupViewNavigation();
    this.setupZenMode();
    this.setupClockAndGreeting();
    this.setupDateSettingsModal();
    this.setupSearchBar();
    this.setupAntigravityMode();
    this.setupReminders();
    this.setupAlarmRingingEngine();
    this.setupModalEvents();
    this.setupStorageSyncListener();
    this.renderBoards();
    this.renderHomeQuickLauncher();
    this.updateRemindersUI();
    this.updateHomeGlanceBar();

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  setupStorageSyncListener() {
    // Cross-tab real-time sync via chrome.storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
          if (changes.boards && changes.boards.newValue) {
            this.state.boards = changes.boards.newValue;
            this.renderBoards();
            this.renderHomeQuickLauncher();
          }
          if (changes.reminders && changes.reminders.newValue) {
            this.state.reminders = changes.reminders.newValue;
            this.updateRemindersUI();
            this.updateHomeGlanceBar();
          }
        }
      });
    }

    // Cross-tab sync via window storage event (standard fallback)
    window.addEventListener('storage', (e) => {
      if (e.key === 'antigravity_boards' && e.newValue) {
        try {
          this.state.boards = JSON.parse(e.newValue);
          this.renderBoards();
          this.renderHomeQuickLauncher();
        } catch (err) {}
      }
    });
  }

  setupAlarmRingingEngine() {
    const overlay = document.getElementById('alarm-ringing-overlay');
    const stopBtn = document.getElementById('btn-stop-alarm-sound');
    const snoozeBtn = document.getElementById('btn-snooze-alarm');
    const testBtn = document.getElementById('btn-test-alarm-sound');

    // Dismissed alarms deduplication map: key -> timestamp
    this.dismissedAlarms = new Map();

    // Click handler for Stop Alarm Button
    stopBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stopAlarmRing();
    });

    snoozeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stopAlarmRing();
      showToast('💤 Alarm Snoozed for 5 minutes');
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'SNOOZE_ALARM', minutes: 5 }).catch(() => {});
      }
    });

    testBtn?.addEventListener('click', () => {
      this.triggerAlarmRing({
        title: '🔊 Alarm Test Sound',
        message: 'This is a preview of the audible ringing alarm. Click "Stop Alarm" to silence.',
        time: 'Preview'
      });
    });

    // Spacebar / Escape / Enter stops alarm instantly when ringing
    window.addEventListener('keydown', (e) => {
      if (overlay?.classList.contains('ringing') || AlarmSoundEngine.isRinging) {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.stopAlarmRing();
        }
      }
    });

    // Listen to background service worker messages
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'TRIGGER_ALARM_RING') {
          this.triggerAlarmRing(message);
        } else if (message.type === 'STOP_ALARM_RING') {
          this.stopAlarmRing(true);
        }
      });
    }

    // Foreground per-second timer for exact minute alarms (with deduplication)
    setInterval(() => {
      const now = new Date();
      const currentSeconds = now.getSeconds();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentHM = `${currentHours}:${currentMinutes}`;
      const currentDay = now.getDay();

      if (currentSeconds === 0 && this.lastTriggeredMinute !== currentHM) {
        this.lastTriggeredMinute = currentHM;

        const activeReminders = this.state.reminders.filter((r) => r.enabled);
        activeReminders.forEach((rem) => {
          if (rem.time === currentHM) {
            const days = Array.isArray(rem.days) ? rem.days : [0, 1, 2, 3, 4, 5, 6];
            if (days.includes(currentDay)) {
              this.triggerAlarmRing(rem);
            }
          }
        });
      }
    }, 1000);
  }

  triggerAlarmRing(data) {
    if (!data) return;

    // Deduplication check: prevent same alarm from triggering twice within 60s
    const alarmKey = `${data.id || data.title || 'alarm'}-${data.time || ''}`;
    const now = Date.now();
    if (this.dismissedAlarms && this.dismissedAlarms.has(alarmKey)) {
      const lastDismissed = this.dismissedAlarms.get(alarmKey);
      if (now - lastDismissed < 60000) {
        return; // Suppress duplicate ring within 60s
      }
    }

    this.currentActiveAlarmKey = alarmKey;

    const overlay = document.getElementById('alarm-ringing-overlay');
    const titleEl = document.getElementById('alarm-ringing-title');
    const msgEl = document.getElementById('alarm-ringing-msg');
    const timeEl = document.getElementById('alarm-ringing-time');

    if (titleEl) titleEl.textContent = data.title || 'Scheduled Reminder';
    if (msgEl) msgEl.textContent = data.message || 'Time is up for your alarm.';
    if (timeEl) timeEl.textContent = data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Start Synthesized Audio Chime
    AlarmSoundEngine.start();

    // Show Ringing Alert Overlay with Stop Button
    overlay?.classList.add('ringing');

    // Also trigger Desktop Notification if permitted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`⏰ ${data.title || 'Antigravity Alarm'}`, {
          body: data.message || 'Your scheduled alarm is ringing!',
          requireInteraction: true
        });
      } catch (e) {}
    }
  }

  stopAlarmRing(fromBroadcast = false) {
    if (this.currentActiveAlarmKey && this.dismissedAlarms) {
      this.dismissedAlarms.set(this.currentActiveAlarmKey, Date.now());
    }

    const overlay = document.getElementById('alarm-ringing-overlay');
    overlay?.classList.remove('ringing');
    AlarmSoundEngine.stop();
    showToast('⏹️ Alarm Stopped');

    // Broadcast STOP_ALARM_RING to service worker and all other open tabs
    if (!fromBroadcast && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'STOP_ALARM_RING' }).catch(() => {});
    }
  }

  setupViewNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const viewId = tab.getAttribute('data-view');
        this.switchView(viewId);
      });
    });

    document.getElementById('glance-pomodoro-trigger')?.addEventListener('click', () => this.switchView('view-focus'));
    document.getElementById('glance-weekly-trigger')?.addEventListener('click', () => this.switchView('view-focus'));
    document.getElementById('glance-reminder-trigger')?.addEventListener('click', () => this.switchView('view-reminders'));

    window.addEventListener('keydown', (e) => {
      if (document.activeElement.matches('input, textarea, select')) return;
      if (e.key === '1') this.switchView('view-home');
      if (e.key === '2') this.switchView('view-boards');
      if (e.key === '3') this.switchView('view-focus');
      if (e.key === '4') this.switchView('view-reminders');
      if (e.key.toLowerCase() === 'z') this.toggleZenMode();
      if (e.key === 'Escape' && document.body.classList.contains('zen-mode')) this.toggleZenMode(false);
    });

    this.switchView(this.state.activeView || 'view-home');
  }

  switchView(viewId) {
    if (!document.getElementById(viewId)) viewId = 'view-home';
    this.state.activeView = viewId;

    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });

    document.querySelectorAll('.dashboard-view').forEach((view) => {
      view.classList.toggle('active', view.id === viewId);
    });

    StorageService.set({ activeView: viewId });
  }

  setupZenMode() {
    const toggleBtn = document.getElementById('btn-toggle-zen');
    const exitBtn = document.getElementById('btn-exit-zen');

    toggleBtn?.addEventListener('click', () => this.toggleZenMode());
    exitBtn?.addEventListener('click', () => this.toggleZenMode(false));
  }

  toggleZenMode(forceState = null) {
    const isZen = forceState !== null ? forceState : !document.body.classList.contains('zen-mode');
    document.body.classList.toggle('zen-mode', isZen);
    if (isZen) {
      showToast('👁️ Zen Mode: UI Hidden. Press Z or Escape to restore.');
    }
  }

  renderHomeQuickLauncher() {
    const container = document.getElementById('home-quick-launcher');
    if (!container) return;
    container.innerHTML = '';

    const bookmarkBoards = this.state.boards.filter((b) => b.type === 'bookmark');
    const allBookmarks = bookmarkBoards.flatMap((b) => b.items);

    allBookmarks.forEach((item) => {
      const pill = document.createElement('div');
      pill.className = 'quick-launch-pill';
      pill.title = `${item.title}\n${item.url}`;

      const favicon = resolveFaviconUrl(item.url, item.icon);
      pill.innerHTML = `
        <a class="quick-launch-link" href="${item.url}" target="_blank" rel="noopener noreferrer">
          <img src="${favicon}" alt="" onerror="this.src='https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.url)}&sz=64'">
          <span>${escapeHTML(item.title)}</span>
        </a>
        <button class="quick-launch-remove-btn" title="Remove Shortcut" data-delete-shortcut="${item.id}">✕</button>
      `;

      pill.querySelector('[data-delete-shortcut]')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        bookmarkBoards.forEach((board) => {
          board.items = board.items.filter((i) => i.id !== item.id);
        });
        await this.saveBoards();
        this.renderBoards();
        this.renderHomeQuickLauncher();
        showToast(`Removed shortcut: ${item.title}`);
      });

      container.appendChild(pill);
    });

    // Add "+ Add Shortcut" button to quick launcher
    const addBtn = document.createElement('button');
    addBtn.className = 'quick-launch-pill quick-launch-add-btn';
    addBtn.title = 'Add New Shortcut';
    addBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Add Shortcut</span>
    `;
    addBtn.addEventListener('click', () => {
      let qlBoard = this.state.boards.find((b) => b.id === 'board-quick-links' || b.type === 'bookmark');
      if (!qlBoard) {
        qlBoard = {
          id: 'board-quick-links',
          title: 'Quick Links',
          type: 'bookmark',
          items: []
        };
        this.state.boards.unshift(qlBoard);
      }
      this.openItemModal(qlBoard.id, null);
    });
    container.appendChild(addBtn);
  }

  updateHomeGlanceBar() {
    const weeklyHoursEl = document.getElementById('glance-weekly-hours');
    if (weeklyHoursEl && this.weeklyTracker) {
      const totalMinutes = Object.values(this.weeklyTracker.data.dailyMinutes).reduce((a, b) => a + (Number(b) || 0), 0);
      const totalHours = (totalMinutes / 60).toFixed(1);
      weeklyHoursEl.textContent = `${totalHours} / ${this.weeklyTracker.data.targetHours}h`;
    }

    const nextRemText = document.getElementById('glance-next-reminder-text');
    const activeReminders = this.state.reminders.filter((r) => r.enabled);
    if (nextRemText) {
      if (activeReminders.length > 0) {
        nextRemText.textContent = `Next: ${activeReminders[0].title} (${activeReminders[0].time})`;
      } else {
        nextRemText.textContent = `No scheduled reminders`;
      }
    }
  }

  setupClockAndGreeting() {
    const clockEl = document.getElementById('digital-clock');
    const ampmEl = document.getElementById('clock-ampm');
    const greetingEl = document.getElementById('greeting-text');
    const userNameEl = document.getElementById('user-display-name');
    const dateEl = document.getElementById('current-date');
    const milestonePill = document.getElementById('milestone-pill');
    const milestoneText = document.getElementById('milestone-text');
    const headerContainer = document.getElementById('header-datetime-container');

    headerContainer?.addEventListener('click', () => {
      this.populateDateSettingsForm();
      openModal('modal-date-settings');
    });

    const updateDateTime = () => {
      const now = new Date();
      const cfg = this.state.customDateSettings;

      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');

      if (cfg.clockFormat === '12h') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const timeStr = cfg.showSeconds ? `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}` : `${hours.toString().padStart(2, '0')}:${minutes}`;
        if (clockEl) clockEl.textContent = timeStr;
        if (ampmEl) {
          ampmEl.textContent = ampm;
          ampmEl.style.display = 'inline';
        }
      } else {
        const timeStr = cfg.showSeconds ? `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}` : `${hours.toString().padStart(2, '0')}:${minutes}`;
        if (clockEl) clockEl.textContent = timeStr;
        if (ampmEl) ampmEl.style.display = 'none';
      }

      let greeting = 'Good day';
      const actualHours = now.getHours();
      if (cfg.customGreeting) {
        greeting = cfg.customGreeting;
      } else {
        if (actualHours >= 5 && actualHours < 12) greeting = 'Good morning';
        else if (actualHours >= 12 && actualHours < 17) greeting = 'Good afternoon';
        else if (actualHours >= 17 && actualHours < 22) greeting = 'Good evening';
        else greeting = 'Good night';
      }

      if (greetingEl) greetingEl.textContent = greeting;
      if (userNameEl) userNameEl.textContent = cfg.userName || 'Explorer';

      if (dateEl) {
        dateEl.textContent = this.formatCustomDate(now, cfg.dateFormat);
      }

      if (cfg.countdownEventName && cfg.countdownEventDate) {
        const targetDate = new Date(cfg.countdownEventDate);
        targetDate.setHours(0, 0, 0, 0);
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffTime = targetDate - todayMidnight;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let countdownMsg = `${cfg.countdownEventName}: `;
        if (diffDays > 0) countdownMsg += `${diffDays} days left`;
        else if (diffDays === 0) countdownMsg += `Today! 🎉`;
        else countdownMsg += `${Math.abs(diffDays)} days ago`;

        if (milestoneText) milestoneText.textContent = countdownMsg;
        if (milestonePill) milestonePill.style.display = 'inline-flex';
      } else {
        if (milestonePill) milestonePill.style.display = 'none';
      }
    };

    updateDateTime();
    setInterval(updateDateTime, 1000);
  }

  formatCustomDate(now, formatType) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const d = now.getDate().toString().padStart(2, '0');
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const y = now.getFullYear();

    switch (formatType) {
      case 'short':
        return `${shortDays[now.getDay()]}, ${now.getDate()} ${shortMonths[now.getMonth()]} ${y}`;
      case 'numeric_dmy':
        return `${shortDays[now.getDay()]} • ${d}/${m}/${y}`;
      case 'numeric_mdy':
        return `${shortDays[now.getDay()]} • ${m}/${d}/${y}`;
      case 'iso':
        return `${shortDays[now.getDay()]} • ${y}-${m}-${d}`;
      case 'week_day':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        return `${days[now.getDay()]} • Week ${getISOWeekNumber(now)} • Day ${dayOfYear}`;
      case 'full':
      default:
        return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${y}`;
    }
  }

  setupDateSettingsModal() {
    const openBtn = document.getElementById('btn-open-date-settings');
    const form = document.getElementById('form-date-settings');

    openBtn?.addEventListener('click', () => {
      this.populateDateSettingsForm();
      openModal('modal-date-settings');
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.state.customDateSettings = {
        userName: document.getElementById('setting-user-name').value.trim() || 'Explorer',
        customGreeting: document.getElementById('setting-custom-greeting').value.trim(),
        clockFormat: document.getElementById('setting-clock-format').value,
        showSeconds: document.getElementById('setting-show-seconds').value === 'true',
        dateFormat: document.getElementById('setting-date-format').value,
        countdownEventName: document.getElementById('setting-countdown-name').value.trim(),
        countdownEventDate: document.getElementById('setting-countdown-date').value
      };

      await StorageService.set({ customDateSettings: this.state.customDateSettings });
      closeModal('modal-date-settings');
    });
  }

  populateDateSettingsForm() {
    const cfg = this.state.customDateSettings;
    document.getElementById('setting-user-name').value = cfg.userName || '';
    document.getElementById('setting-custom-greeting').value = cfg.customGreeting || '';
    document.getElementById('setting-clock-format').value = cfg.clockFormat || '24h';
    document.getElementById('setting-show-seconds').value = cfg.showSeconds ? 'true' : 'false';
    document.getElementById('setting-date-format').value = cfg.dateFormat || 'full';
    document.getElementById('setting-countdown-name').value = cfg.countdownEventName || '';
    document.getElementById('setting-countdown-date').value = cfg.countdownEventDate || '';
  }

  setupSearchBar() {
    const input = document.getElementById('search-input');
    const select = document.getElementById('search-engine-select');
    const submitBtn = document.getElementById('search-submit-btn');
    const clearBtn = document.getElementById('search-clear-btn');

    if (select) {
      select.value = this.state.searchEngine;
      select.addEventListener('change', (e) => {
        this.state.searchEngine = e.target.value;
        StorageService.set({ searchEngine: this.state.searchEngine });
      });
    }

    const performSearch = () => {
      const query = input.value.trim();
      if (!query) {
        if (this.state.searchEngine === 'gemini') {
          window.location.href = 'https://gemini.google.com/app';
        }
        return;
      }

      if (/^(https?:\/\/|www\.)/i.test(query) || (query.includes('.') && !query.includes(' '))) {
        const url = query.startsWith('http') ? query : `https://${query}`;
        window.location.href = url;
        return;
      }

      const engines = {
        google: 'https://www.google.com/search?q=',
        gemini: 'https://gemini.google.com/app?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        github: 'https://github.com/search?q=',
        youtube: 'https://www.youtube.com/results?search_query=',
        reddit: 'https://www.reddit.com/search/?q='
      };

      const base = engines[this.state.searchEngine] || engines.google;
      window.location.href = base + encodeURIComponent(query);
    };

    submitBtn?.addEventListener('click', performSearch);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });

    input?.addEventListener('input', () => {
      if (clearBtn) clearBtn.style.display = input.value ? 'block' : 'none';
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      input.focus();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== input && !document.activeElement.matches('input, textarea, select')) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  setupAntigravityMode() {
    const toggleBtn = document.getElementById('toggle-antigravity');
    const updateBodyClass = () => {
      document.body.classList.toggle('antigravity-active', this.state.antigravityEnabled);
      toggleBtn?.classList.toggle('active', this.state.antigravityEnabled);
    };

    updateBodyClass();

    toggleBtn?.addEventListener('click', () => {
      this.state.antigravityEnabled = !this.state.antigravityEnabled;
      StorageService.set({ antigravityEnabled: this.state.antigravityEnabled });
      updateBodyClass();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.state.antigravityEnabled) return;
      const cards = document.querySelectorAll('.board-card');
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardX = rect.left + rect.width / 2;
        const cardY = rect.top + rect.height / 2;
        const dist = Math.hypot(mouseX - cardX, mouseY - cardY);

        if (dist < 400) {
          const deltaX = (mouseX - cardX) / 30;
          const deltaY = (mouseY - cardY) / 30;
          card.style.transform = `perspective(1000px) rotateY(${deltaX}deg) rotateX(${-deltaY}deg) translateY(-4px)`;
        } else {
          card.style.transform = '';
        }
      });
    });
  }

  setupReminders() {
    const btnAddModal = document.getElementById('btn-add-reminder-modal-trigger');
    const form = document.getElementById('form-reminder');

    btnAddModal?.addEventListener('click', () => openModal('modal-reminders'));

    document.querySelectorAll('.day-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
      });
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('rem-title-input').value.trim();
      const time = document.getElementById('rem-time-input').value;
      const message = document.getElementById('rem-msg-input').value.trim();

      const activeDays = Array.from(document.querySelectorAll('.day-chip.active')).map((c) => parseInt(c.dataset.day));

      const newReminder = {
        id: `rem-${Date.now()}`,
        title,
        time,
        message,
        enabled: true,
        days: activeDays.length > 0 ? activeDays : [0, 1, 2, 3, 4, 5, 6]
      };

      this.state.reminders.push(newReminder);
      await StorageService.set({ reminders: this.state.reminders });
      this.syncAlarms();
      this.updateRemindersUI();
      this.updateHomeGlanceBar();
      form.reset();
      document.querySelectorAll('.day-chip').forEach((c) => c.classList.add('active'));
      closeModal('modal-reminders');
      showToast(`🔔 Reminder Added: ${title}`);
    });
  }

  syncAlarms() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SYNC_ALARMS' });
    }
  }

  updateRemindersUI() {
    const listContainer = document.getElementById('reminders-dashboard-list');
    const countBadge = document.getElementById('nav-reminders-count');

    const activeReminders = this.state.reminders.filter((r) => r.enabled);
    if (countBadge) countBadge.textContent = activeReminders.length;

    const dayShortNames = { 0: 'Su', 1: 'Mo', 2: 'Tu', 3: 'We', 4: 'Th', 5: 'Fr', 6: 'Sa' };

    if (listContainer) {
      listContainer.innerHTML = '';
      if (this.state.reminders.length === 0) {
        listContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 20px;">No reminders configured yet. Click 'Add Reminder' to get started.</p>`;
      } else {
        this.state.reminders.forEach((rem) => {
          const daysArray = Array.isArray(rem.days) ? rem.days : [0, 1, 2, 3, 4, 5, 6];
          const daysTags = daysArray.map((d) => `<span class="reminder-day-mini">${dayShortNames[d]}</span>`).join('');

          const row = document.createElement('div');
          row.className = 'reminder-row';
          row.innerHTML = `
            <div class="reminder-row-left">
              <span class="reminder-row-time">${rem.time}</span>
              <div class="reminder-row-details">
                <h5>${escapeHTML(rem.title)}</h5>
                <p>${escapeHTML(rem.message || 'Scheduled alert')}</p>
                <div class="reminder-days-tags">${daysTags}</div>
              </div>
            </div>
            <div class="reminder-row-actions">
              <button class="btn-test-row-alarm" data-rem-test="${rem.id}" title="Test Sound & Stop Button">🔊 Ring</button>
              <label class="switch">
                <input type="checkbox" ${rem.enabled ? 'checked' : ''} data-rem-toggle="${rem.id}">
                <span class="slider"></span>
              </label>
              <button class="item-btn delete" data-rem-delete="${rem.id}" title="Delete">✕</button>
            </div>
          `;
          listContainer.appendChild(row);
        });

        // Test Ring per row
        listContainer.querySelectorAll('[data-rem-test]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-rem-test');
            const target = this.state.reminders.find((r) => r.id === id);
            if (target) {
              this.triggerAlarmRing(target);
            }
          });
        });

        listContainer.querySelectorAll('[data-rem-toggle]').forEach((checkbox) => {
          checkbox.addEventListener('change', async (e) => {
            const id = e.target.getAttribute('data-rem-toggle');
            const target = this.state.reminders.find((r) => r.id === id);
            if (target) {
              target.enabled = e.target.checked;
              await StorageService.set({ reminders: this.state.reminders });
              this.syncAlarms();
              this.updateRemindersUI();
              this.updateHomeGlanceBar();
            }
          });
        });

        listContainer.querySelectorAll('[data-rem-delete]').forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-rem-delete');
            this.state.reminders = this.state.reminders.filter((r) => r.id !== id);
            await StorageService.set({ reminders: this.state.reminders });
            this.syncAlarms();
            this.updateRemindersUI();
            this.updateHomeGlanceBar();
          });
        });
      }
    }
  }

  renderBoards() {
    const container = document.getElementById('boards-container');
    if (!container) return;
    container.innerHTML = '';

    this.state.boards.forEach((board, boardIndex) => {
      const boardEl = document.createElement('div');
      boardEl.className = 'board-card glass-panel';
      boardEl.dataset.boardId = board.id;
      boardEl.dataset.boardIndex = boardIndex;
      boardEl.draggable = true;

      const headerEl = document.createElement('div');
      headerEl.className = 'board-header';
      headerEl.innerHTML = `
        <div class="board-header-left">
          <span class="board-drag-handle" title="Drag to reorder boards">⋮⋮</span>
          <h3 class="board-title" contenteditable="true" spellcheck="false">${escapeHTML(board.title)}</h3>
          <span class="board-item-count">${board.items.length}</span>
        </div>
        <div class="board-actions">
          <button class="board-btn btn-add-item" title="Add Item" data-add-item="${board.id}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button class="board-btn btn-delete-board" title="Delete Board" data-delete-board="${board.id}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'board-items-container';
      itemsContainer.dataset.boardId = board.id;

      board.items.forEach((item, itemIndex) => {
        const itemEl = this.createItemElement(item, board, itemIndex);
        itemsContainer.appendChild(itemEl);
      });

      boardEl.appendChild(headerEl);
      boardEl.appendChild(itemsContainer);
      container.appendChild(boardEl);

      const titleEl = headerEl.querySelector('.board-title');
      titleEl.addEventListener('blur', () => {
        board.title = titleEl.textContent.trim() || 'Untitled Board';
        this.saveBoards();
        this.renderHomeQuickLauncher();
      });
      titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          titleEl.blur();
        }
      });
    });

    this.setupDragAndDrop();
    this.bindBoardActionButtons();
  }

  createItemElement(item, board, index) {
    const itemEl = document.createElement('div');
    itemEl.draggable = true;
    itemEl.dataset.itemId = item.id;
    itemEl.dataset.boardId = board.id;
    itemEl.dataset.itemIndex = index;

    if (board.type === 'bookmark') {
      itemEl.className = 'bookmark-item';
      const favicon = resolveFaviconUrl(item.url, item.icon);
      itemEl.innerHTML = `
        <div class="bookmark-left">
          <img class="bookmark-favicon" src="${favicon}" alt="" onerror="this.src='https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.url)}&sz=64'">
          <div class="bookmark-info">
            <span class="bookmark-name">${escapeHTML(item.title)}</span>
            <span class="bookmark-url">${escapeHTML(item.url ? item.url.replace(/^https?:\/\//, '') : '')}</span>
          </div>
        </div>
        <div class="item-action-btns">
          <button class="item-btn edit-item-btn" title="Edit">✎</button>
          <button class="item-btn delete delete-item-btn" title="Delete">✕</button>
        </div>
      `;

      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.item-action-btns')) return;
        window.open(item.url, '_blank');
      });
    } else {
      itemEl.className = `task-item ${item.completed ? 'completed' : ''}`;
      itemEl.innerHTML = `
        <div class="task-left">
          <div class="task-checkbox ${item.completed ? 'checked' : ''}" data-toggle-task="${item.id}"></div>
          <span class="task-label">${escapeHTML(item.title)}</span>
          ${item.tag ? `<span class="tag-badge tag-${item.tag}">${escapeHTML(item.tag)}</span>` : ''}
        </div>
        <div class="item-action-btns">
          <button class="item-btn edit-item-btn" title="Edit">✎</button>
          <button class="item-btn delete delete-item-btn" title="Delete">✕</button>
        </div>
      `;

      const checkbox = itemEl.querySelector('[data-toggle-task]');
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        item.completed = !item.completed;
        this.saveBoards();
        this.renderBoards();
      });
    }

    itemEl.querySelector('.delete-item-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      board.items = board.items.filter((i) => i.id !== item.id);
      this.saveBoards();
      this.renderBoards();
      this.renderHomeQuickLauncher();
    });

    itemEl.querySelector('.edit-item-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openItemModal(board.id, item);
    });

    return itemEl;
  }

  bindBoardActionButtons() {
    document.querySelectorAll('[data-add-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const boardId = btn.getAttribute('data-add-item');
        this.openItemModal(boardId, null);
      });
    });

    document.querySelectorAll('[data-delete-board]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const boardId = btn.getAttribute('data-delete-board');
        if (confirm('Delete this board and its contents?')) {
          this.state.boards = this.state.boards.filter((b) => b.id !== boardId);
          this.saveBoards();
          this.renderBoards();
          this.renderHomeQuickLauncher();
        }
      });
    });

    document.getElementById('btn-new-board')?.addEventListener('click', () => {
      openModal('modal-board');
    });
  }

  openItemModal(boardId, existingItem = null) {
    let board = this.state.boards.find((b) => b.id === boardId);
    if (!board) {
      board = this.state.boards.find((b) => b.type === 'bookmark') || this.state.boards[0];
    }
    if (!board) return;

    const modalTitle = document.getElementById('modal-item-title');
    const boardIdInput = document.getElementById('item-board-id');
    const editIdInput = document.getElementById('item-edit-id');
    const typeInput = document.getElementById('item-board-type');
    const titleInput = document.getElementById('item-title-input');
    const urlInput = document.getElementById('item-url-input');
    const tagInput = document.getElementById('item-tag-input');
    const groupUrl = document.getElementById('group-bookmark-url');
    const groupTag = document.getElementById('group-task-tag');

    boardIdInput.value = board.id;
    typeInput.value = board.type;
    editIdInput.value = existingItem ? existingItem.id : '';

    if (board.type === 'bookmark') {
      groupUrl.style.display = 'flex';
      groupTag.style.display = 'none';
      urlInput.required = true;
      modalTitle.textContent = existingItem ? 'Edit Bookmark' : 'Add Bookmark';
      titleInput.value = existingItem ? existingItem.title : '';
      urlInput.value = existingItem ? existingItem.url : '';
    } else {
      groupUrl.style.display = 'none';
      groupTag.style.display = 'flex';
      urlInput.required = false;
      modalTitle.textContent = existingItem ? 'Edit Task' : 'Add Task';
      titleInput.value = existingItem ? existingItem.title : '';
      tagInput.value = existingItem && existingItem.tag ? existingItem.tag : 'general';
    }

    openModal('modal-item');
  }

  setupModalEvents() {
    document.getElementById('form-item')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const boardId = document.getElementById('item-board-id').value;
      const editId = document.getElementById('item-edit-id').value;
      const type = document.getElementById('item-board-type').value;
      const title = document.getElementById('item-title-input').value.trim();
      const url = document.getElementById('item-url-input').value.trim();
      const tag = document.getElementById('item-tag-input').value;

      let board = this.state.boards.find((b) => b.id === boardId);
      if (!board) {
        board = this.state.boards.find((b) => b.type === (type || 'bookmark')) || this.state.boards[0];
      }
      if (!board) return;

      if (editId) {
        const item = board.items.find((i) => i.id === editId);
        if (item) {
          item.title = title;
          if (type === 'bookmark') {
            item.url = url;
            item.icon = resolveFaviconUrl(url, item.icon);
          }
          if (type === 'task') item.tag = tag;
        }
      } else {
        if (type === 'bookmark') {
          const finalUrl = url.startsWith('http') ? url : `https://${url}`;
          board.items.push({
            id: `item-${Date.now()}`,
            title,
            url: finalUrl,
            icon: resolveFaviconUrl(finalUrl, '')
          });
        } else {
          board.items.push({
            id: `item-${Date.now()}`,
            title,
            completed: false,
            tag
          });
        }
      }

      await this.saveBoards();
      this.renderBoards();
      this.renderHomeQuickLauncher();
      closeModal('modal-item');
      showToast(type === 'bookmark' ? `✅ Shortcut saved: ${title}` : `✅ Task added: ${title}`);
    });

    document.getElementById('form-board')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('board-name-input').value.trim();
      const type = document.getElementById('board-type-select').value;

      this.state.boards.push({
        id: `board-${Date.now()}`,
        title: name,
        type: type,
        items: []
      });

      await this.saveBoards();
      this.renderBoards();
      closeModal('modal-board');
      document.getElementById('form-board').reset();
      showToast(`✅ Created board: ${name}`);
    });

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeModal(btn.getAttribute('data-close-modal'));
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal(backdrop.id);
      });
    });
  }

  setupDragAndDrop() {
    let draggedType = null;

    document.querySelectorAll('.board-card').forEach((boardEl) => {
      const handle = boardEl.querySelector('.board-drag-handle');

      handle?.addEventListener('mousedown', () => {
        boardEl.draggable = true;
      });

      boardEl.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('bookmark-item') || e.target.classList.contains('task-item')) {
          draggedType = 'card';
          e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'card',
            itemId: e.target.dataset.itemId,
            sourceBoardId: e.target.dataset.boardId
          }));
        } else {
          draggedType = 'board';
          e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'board',
            boardId: boardEl.dataset.boardId
          }));
        }
        e.target.classList.add('dragging');
        e.stopPropagation();
      });

      boardEl.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
      });

      boardEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        boardEl.classList.add('drag-over');
      });

      boardEl.addEventListener('dragleave', () => {
        boardEl.classList.remove('drag-over');
      });

      boardEl.addEventListener('drop', (e) => {
        e.preventDefault();
        boardEl.classList.remove('drag-over');

        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));

          if (data.type === 'board' && draggedType === 'board') {
            const sourceIndex = this.state.boards.findIndex((b) => b.id === data.boardId);
            const targetIndex = parseInt(boardEl.dataset.boardIndex);

            if (sourceIndex > -1 && targetIndex > -1 && sourceIndex !== targetIndex) {
              const [moved] = this.state.boards.splice(sourceIndex, 1);
              this.state.boards.splice(targetIndex, 0, moved);
              this.saveBoards();
              this.renderBoards();
            }
          } else if (data.type === 'card') {
            const sourceBoard = this.state.boards.find((b) => b.id === data.sourceBoardId);
            const targetBoard = this.state.boards.find((b) => b.id === boardEl.dataset.boardId);

            if (sourceBoard && targetBoard) {
              const itemIndex = sourceBoard.items.findIndex((i) => i.id === data.itemId);
              if (itemIndex > -1) {
                const [item] = sourceBoard.items.splice(itemIndex, 1);
                targetBoard.items.push(item);
                this.saveBoards();
                this.renderBoards();
                this.renderHomeQuickLauncher();
              }
            }
          }
        } catch (err) {
          console.error('Drop error', err);
        }
      });
    });
  }

  async saveBoards() {
    await StorageService.set({ boards: this.state.boards });
  }
}

// --- 10. HELPER UTILITIES & TOAST ---
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Bootstrapping
window.addEventListener('DOMContentLoaded', () => {
  window.antigravityApp = new AntigravityApp();
});
