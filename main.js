// script.js
/* eslint-disable no-undef */

// Util: seleccionar
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {
  lucide?.createIcons?.();

  // Año dinámico
  $('#year').textContent = new Date().getFullYear();

  // Menú responsive
  const toggle = $('#nav-toggle');
  const mobileMenu = $('#nav-menu-mobile');
  toggle?.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    toggle.setAttribute('aria-expanded', mobileMenu.classList.contains('hidden') ? 'false' : 'true');
  });

  // Enlaces navegan y cierran menú móvil
  $$('[data-nav]').forEach((a) => {
    a.addEventListener('click', () => {
      mobileMenu?.classList.add('hidden');
    });
  });

  // Intersección para resaltar el link activo
  const navLinks = $$('.nav-link');
  const sections = ['hero', 'about', 'projects', 'contact'].map((id) => document.getElementById(id));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.id;
      const link = navLinks.find((l) => l.getAttribute('href') === `#${id}`);
      if (entry.isIntersecting) {
        navLinks.forEach((l) => l.classList.remove('is-active'));
        link?.classList.add('is-active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 });
  sections.forEach((s) => s && obs.observe(s));

  // Validación simple del formulario
  const form = $('#contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name');
    const email = $('#email');
    const message = $('#message');
    const privacy = $('#privacy');
    const status = $('#form-status');

    let valid = true;

    // Helpers de error
    const setErr = (el, msg = '') => {
      const err = document.querySelector(`[data-error-for="${el.id}"]`);
      if (msg) {
        err.textContent = msg;
        el.setAttribute('aria-invalid', 'true');
      } else {
        err.textContent = '';
        el.removeAttribute('aria-invalid');
      }
    };

    if (!name.value.trim()) { setErr(name, 'Por favor, ingresa tu nombre.'); valid = false; } else setErr(name);
    if (!/^\S+@\S+\.\S+$/.test(email.value)) { setErr(email, 'Ingresa un email válido.'); valid = false; } else setErr(email);
    if (message.value.trim().length < 10) { setErr(message, 'El mensaje debe tener al menos 10 caracteres.'); valid = false; } else setErr(message);
    if (!privacy.checked) { valid = false; privacy.focus(); }

    if (!valid) return;

    // Simulación de envío
    status.textContent = 'Enviando…';
    setTimeout(() => {
      status.textContent = '¡Gracias! Tu mensaje ha sido enviado correctamente.';
      form.reset();
    }, 600);
  });

  // GSAP Scroll Animations (respetando prefers-reduced-motion)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && window.gsap) {
    gsap.registerPlugin(ScrollTrigger);

    // Fade-up en secciones
    $$('.section').forEach((section) => {
      gsap.from(section.querySelectorAll('.section-title, .section-text, .card, form, .stat'), {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
        },
      });
    });

    // Hover glow en cards (ligero parallax en img)
    $$('.card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
        card.style.transform = `perspective(800px) rotateX(${-y}deg) rotateY(${x}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
      });
    });
  }

  // THREE.JS — Partículas suaves en el Hero
  initHeroThree();
});

/** Three.js minimalista e interactivo (pausado si reduce motion) */
function initHeroThree() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.THREE) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 3.5;

  // Partículas
  const count = 1200;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    scales[i] = Math.random() * 1.2 + 0.4;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.PointsMaterial({
    color: 0x9b5cff,
    size: 0.02,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // Luz sutil
  const light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(light);

  // Interacción
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Animación
  let rafId;
  const tick = () => {
    points.rotation.y += 0.0009;
    points.rotation.x += 0.0006;

    // Seguimiento leve a cursor
    points.position.x += (mouse.x * 0.3 - points.position.x) * 0.02;
    points.position.y += (mouse.y * 0.2 - points.position.y) * 0.02;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };

  if (!reduced) tick();

  // Resize
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Pausar si reduce motion cambia
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onChange = () => {
    if (media.matches) {
      cancelAnimationFrame(rafId);
    } else {
      tick();
    }
  };
  media.addEventListener?.('change', onChange);

  // Limpieza si fuera necesario (no requerido en página estática)
}
