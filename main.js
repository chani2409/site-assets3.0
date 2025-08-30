// script.js
(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    setYear();
    initMenu();
    initActiveNav();
    initSmoothAnchors();
    if (!prefersReducedMotion) {
      initGSAP();
      initCardsTilt();
      initHeroThree();
    }
    initForm();
  });

  function setYear() {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  // Mobile menu toggle
  function initMenu() {
    const btn = document.getElementById('menuBtn');
    const mobile = document.getElementById('mobileNav');
    const closeIcon = document.getElementById('closeIcon');

    if (!btn || !mobile) return;

    btn.addEventListener('click', () => {
      const isOpen = mobile.classList.toggle('hidden') === false;
      btn.setAttribute('aria-expanded', String(isOpen));
      if (closeIcon) closeIcon.classList.toggle('hidden', !isOpen);
    });

    mobile.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobile.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        closeIcon?.classList.add('hidden');
      });
    });
  }

  // Smooth anchors (fallback on browsers without CSS smooth)
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const hash = anchor.getAttribute('href');
        if (!hash || hash.length < 2) return;
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', hash);
      });
    });
  }

  // Active nav highlighting
  function initActiveNav() {
    const links = Array.from(document.querySelectorAll('.nav-link'));
    const ids = links.map(l => l.getAttribute('href')).filter(Boolean);
    const targets = ids.map(id => document.querySelector(id)).filter(Boolean);

    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = '#' + entry.target.id;
        const link = links.find(l => l.getAttribute('href') === id);
        if (link && entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0.1 });

    targets.forEach(t => observer.observe(t));
  }

  // GSAP animations
  function initGSAP() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // Header reveal
    gsap.from('header', { y: -60, duration: 0.8, ease: 'power3.out' });

    // Hero text
    gsap.from('#hero h1 span', {
      yPercent: 30, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out'
    });
    gsap.from('#hero p, #hero a', {
      opacity: 0, y: 20, duration: 0.8, stagger: 0.08, ease: 'power2.out', delay: 0.2
    });

    // Sections
    ['#about', '#projects', '#contact'].forEach((sel) => {
      gsap.from(`${sel} h2`, {
        scrollTrigger: { trigger: sel, start: 'top 75%' },
        y: 20, opacity: 0, duration: 0.8, ease: 'power2.out'
      });
      gsap.from(`${sel} p, ${sel} li, ${sel} form, ${sel} .grid > *`, {
        scrollTrigger: { trigger: sel, start: 'top 70%' },
        y: 24, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.06
      });
    });
  }

  // Card tilt interaction
  function initCardsTilt() {
    const cards = document.querySelectorAll('.project-card');
    const maxTilt = 10; // deg
    const enterScale = 1.01;

    cards.forEach(card => {
      let raf = 0;
      const state = { rx: 0, ry: 0, tx: 0, ty: 0 };

      function onMove(e) {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        state.ry = (px - 0.5) * (maxTilt * 2);
        state.rx = -(py - 0.5) * (maxTilt * 2);
        state.tx = (px - 0.5) * 6;
        state.ty = (py - 0.5) * 6;
        if (!raf) raf = requestAnimationFrame(apply);
      }

      function apply() {
        raf = 0;
        card.style.transform = `perspective(900px) rotateX(${state.rx.toFixed(2)}deg) rotateY(${state.ry.toFixed(2)}deg) translateZ(0) scale(${enterScale})`;
      }

      function reset() {
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0) scale(1)';
      }

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseenter', () => card.style.transition = 'transform 160ms ease');
      card.addEventListener('mouseleave', () => { reset(); });
      card.addEventListener('focus', () => { card.style.transform = `perspective(900px) translateZ(20px) scale(${enterScale})`; });
      card.addEventListener('blur', reset);
    });
  }

  // Three.js hero background
  function initHeroThree() {
    const container = document.getElementById('hero-canvas');
    if (!container || !window.THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Grid of points
    const grid = 80;
    const size = 8;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(grid * grid * 3);
    const uvs = new Float32Array(grid * grid * 2);

    let i3 = 0, i2 = 0;
    for (let i = 0; i < grid; i++) {
      for (let j = 0; j < grid; j++) {
        const x = (i / (grid - 1) - 0.5) * size;
        const y = (j / (grid - 1) - 0.5) * size;
        positions[i3++] = x;
        positions[i3++] = y;
        positions[i3++] = 0.0;
        uvs[i2++] = i / (grid - 1);
        uvs[i2++] = j / (grid - 1);
      }
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    const uniforms = {
      u_time: { value: 0 },
      u_amp: { value: 0.25 },
      u_speed: { value: 0.6 },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_colorA: { value: new THREE.Color('#7cf2d4') },
      u_colorB: { value: new THREE.Color('#9af7e1') }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform float u_time;
        uniform float u_amp;
        uniform float u_speed;
        uniform vec2 u_mouse;
        varying float vWave;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec3 pos = position;

          float d = distance(uv, u_mouse);
          float ripple = sin((pos.x * 1.6 + pos.y * 1.6) - u_time * u_speed * 2.0) * 0.3;
          float mouseWave = cos(d * 12.0 - u_time * 4.0) * (0.15 / (1.0 + d * 8.0));
          pos.z += (ripple + mouseWave) * u_amp;

          vWave = pos.z;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          float dist = length(gl_Position.xyz);
          gl_PointSize = 3.0 + (2.0 - clamp(dist, 0.0, 2.0)) * 2.0;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vWave;
        varying vec2 vUv;
        uniform vec3 u_colorA;
        uniform vec3 u_colorB;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float mask = smoothstep(0.25, 0.0, dot(p, p));
          vec3 col = mix(u_colorA, u_colorB, vUv.y) + vWave * 0.2;
          gl_FragColor = vec4(col, mask * 0.9);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Gentle rotation group
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    // Mouse interaction
    const mouse = new THREE.Vector2(0.5, 0.5);
    let targetRX = -0.15, targetRY = 0.25;

    function onPointerMove(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouse.set(x, 1.0 - y);
      uniforms.u_mouse.value.copy(mouse);
      targetRY = (x - 0.5) * 0.6;
      targetRX = (y - 0.5) * -0.6;
    }

    window.addEventListener('pointermove',
