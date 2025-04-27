const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');
const selector = document.getElementById('background-selector');

let animationFrameId = null;

// --- Base Class ---
class BackgroundAnimation {
  constructor() {}
  resize() {}
  update() {}
  icon() { return '❓'; }
}

// --- Plain Background ---
class PlainBackground extends BackgroundAnimation {
  constructor(color, iconText) {
    super();
    this.color = color;
    this.iconText = iconText || '🎨';
  }
  update() {
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  icon() {
    return this.iconText;
  }
}

// --- Soft Waves Background ---
class SoftWavesBackground extends BackgroundAnimation {
  constructor() {
    super();
    this.offset = 0;
  }
  update() {
    this.offset += 0.5;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsl(${this.offset % 360}, 70%, 85%)`);
    gradient.addColorStop(1, `hsl(${(this.offset + 60) % 360}, 70%, 90%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  icon() {
    return '🎨';
  }
}

// --- Floating Bubbles Background ---
class BubblesBackground extends BackgroundAnimation {
  constructor(count = 30) {
    super();
    this.count = count;
    this.bubbles = Array.from({length: this.count}, () => this.createBubble());
  }
  createBubble() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 10 + 5,
      speed: Math.random() * 1 + 0.5
    };
  }
  update() {
    ctx.fillStyle = "#e0f7fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    this.bubbles.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      b.y -= b.speed;
      if (b.y < -b.r) {
        b.y = canvas.height + b.r;
        b.x = Math.random() * canvas.width;
      }
    });
  }
  icon() {
    return '🫧';
  }
}

// --- Particle Drift Background ---
class ParticleDriftBackground extends BackgroundAnimation {
  constructor() {
    super();
    this.particles = Array.from({length: 50}, () => this.createParticle());
  }
  createParticle() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1
    };
  }
  update() {
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });
  }
  icon() {
    return '🌌';
  }
}

// --- Connected Particles Background ---
class ConnectedParticlesBackground extends BackgroundAnimation {
  constructor() {
    super();
    this.particles = Array.from({length: 70}, () => this.createParticle());
  }
  createParticle() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      r: Math.random() * 2 + 1
    };
  }
  update() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (dist < 100) {
          ctx.strokeStyle = `rgba(255,255,255,${1 - dist / 100})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
  }
  icon() {
    return '🕸️';
  }
}

class MouseFollowerBackground extends BackgroundAnimation {
  constructor() {
    super();
    this.mouseX = canvas.width / 2;
    this.mouseY = canvas.height / 2;
    this.followerX = this.mouseX;
    this.followerY = this.mouseY;
    this.easing = 0.05;

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }
  update() {
    ctx.fillStyle = "#fefefe";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ease towards mouse position
    this.followerX += (this.mouseX - this.followerX) * this.easing;
    this.followerY += (this.mouseY - this.followerY) * this.easing;

    ctx.beginPath();
    ctx.arc(this.followerX, this.followerY, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#4dabf7";
    ctx.fill();
  }
  icon() {
    return '🧿';
  }
}

class MouseForceFieldBackground extends BackgroundAnimation {
  constructor() {
    super();
    this.mouseX = canvas.width / 2;
    this.mouseY = canvas.height / 2;
    this.particles = Array.from({length: 60}, () => this.createParticle());

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }
  createParticle() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      r: Math.random() * 2 + 2
    };
  }
  update() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    this.particles.forEach(p => {
      // Compute distance to mouse
      const dx = p.x - this.mouseX;
      const dy = p.y - this.mouseY;
      const dist = Math.hypot(dx, dy);

      if (dist < 150) {
        const force = (150 - dist) / 150;
        p.vx += (dx / dist) * force * 0.5;
        p.vy += (dy / dist) * force * 0.5;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Slow down
      p.vx *= 0.95;
      p.vy *= 0.95;

      // Wrap
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  icon() {
    return '🧲';
  }
}

class MouseWaterRippleBackground extends BackgroundAnimation {
  constructor() {
    super();
    this.waves = [];
    this.lastPos = { x: 0, y: 0 };

    window.addEventListener('mousemove', (e) => {

      if (Math.abs(e.clientX - this.lastPos.x) < 15 && Math.abs(e.clientY - this.lastPos.y) < 15) {
        return;
      }

      this.lastPos.x = e.clientX;
      this.lastPos.y = e.clientY;
      
      this.waves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        opacity: 1
      });
    });
  }

  update() {
    ctx.fillStyle = "#e0f7fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.waves.forEach(wave => {
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 150, 255, ${wave.opacity})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      wave.radius += 2;
      wave.opacity -= 0.02;
    });

    // Remove waves that are fully transparent
    this.waves = this.waves.filter(wave => wave.opacity > 0);
  }
  icon() {
    return '💧';
  }
}

// --- Options ---

const backgroundOptions = {
  'Plain': new PlainBackground("#f0f0f0", '⚪'),
  'Plain Blue': new PlainBackground("#d0e7ff", '🔵'),
  'Plain Green': new PlainBackground("#d7f5e9", '🟢'),
  'Plain Purple': new PlainBackground("#e8d7f5", '🟣'),
  'Soft Waves': new SoftWavesBackground(),
  'Floating Bubbles': new BubblesBackground(),
  'Particle Drift': new ParticleDriftBackground(),
  'Connected Particles': new ConnectedParticlesBackground(),
  'Mouse Follower': new MouseFollowerBackground(),
  'Mouse Force Field': new MouseForceFieldBackground(),
  'Mouse Water Ripple': new MouseWaterRippleBackground(),
};


// --- State ---

let activeBackground = null;

for (const option in backgroundOptions) {
  const el = document.createElement('option');
  el.value = option;
  console.log(`Adding option ${option}`, backgroundOptions[option]);
  
  el.textContent = `${backgroundOptions[option].icon()} ${option}`;
  selector.appendChild(el);
}

let url = new URL(window.location.href);
selector.value = url.searchParams.get('background') || 'Plain';

function selectBackground(name) {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  activeBackground = backgroundOptions[name];
  update();
}

selector.addEventListener('change', (event) => {
  url = new URL(window.location.href);
  const selected = event.target.value;
  url.searchParams.set('background', selected);
  window.history.pushState({}, '', url);
  selectBackground(selected);
});

// --- Canvas Setup ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (activeBackground?.resize) {
    activeBackground.resize();
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Animation Loop ---
function update() {
  if (activeBackground) {
    activeBackground.update();
  }
  animationFrameId = requestAnimationFrame(update);
}

// --- Start ---
selectBackground(selector.value);
