/**
 * ABISMO — Horror Stories Platform
 * script.js — Production Grade JavaScript
 */

"use strict";

/* ================================================================
   UTILITY
   ================================================================ */
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/* ================================================================
   CUSTOM CURSOR
   ================================================================ */
const initCursor = () => {
  const dot = qs("#cursor-dot");
  const ring = qs("#cursor-ring");
  if (!dot || !ring) return;

  let mouseX = 0,
    mouseY = 0;
  let ringX = 0,
    ringY = 0;
  let rafId;

  const lerp = (a, b, t) => a + (b - a) * t;

  const animate = () => {
    ringX = lerp(ringX, mouseX, 0.12);
    ringY = lerp(ringY, mouseY, 0.12);

    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${ringX}px,  ${ringY}px)  translate(-50%, -50%)`;

    rafId = requestAnimationFrame(animate);
  };

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener("mouseleave", () => {
    dot.style.opacity = "0";
    ring.style.opacity = "0";
  });

  document.addEventListener("mouseenter", () => {
    dot.style.opacity = "1";
    ring.style.opacity = "1";
  });

  /* Cursor state: click burst */
  document.addEventListener("mousedown", () => {
    dot.style.transform += " scale(0.5)";
    ring.style.transform += " scale(1.5)";
  });

  document.addEventListener("mouseup", () => {
    dot.style.transform = dot.style.transform.replace(" scale(0.5)", "");
    ring.style.transform = ring.style.transform.replace(" scale(1.5)", "");
  });

  animate();
};

/* ================================================================
   PARTICLE SYSTEM — Floating Embers
   ================================================================ */
const initParticles = () => {
  const canvas = qs("#particles-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let W,
    H,
    particles = [];

  const resize = () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const rand = (min, max) => Math.random() * (max - min) + min;

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(init = false) {
      this.x = rand(0, W);
      this.y = init ? rand(0, H) : H + 10;
      this.size = rand(0.5, 2.5);
      this.speedY = rand(0.15, 0.6);
      this.speedX = rand(-0.2, 0.2);
      this.life = 0;
      this.maxLife = rand(200, 500);
      this.color = `hsl(${rand(0, 20)}, ${rand(60, 90)}%, ${rand(35, 65)}%)`;
      this.drift = rand(-0.002, 0.002);
      this.angle = rand(0, Math.PI * 2);
    }

    update() {
      this.y -= this.speedY;
      this.angle += this.drift;
      this.x += this.speedX + Math.sin(this.angle) * 0.3;
      this.life++;
      if (this.y < -10) this.reset();
    }

    draw() {
      const progress = this.life / this.maxLife;
      const alpha = Math.sin(progress * Math.PI) * 0.55;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const PARTICLE_COUNT = window.innerWidth < 768 ? 40 : 80;
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  const loop = () => {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(loop);
  };
  loop();
};

/* ================================================================
   HEADER — Scroll behavior
   ================================================================ */
const initHeader = () => {
  const header = qs("#site-header");
  if (!header) return;

  const update = () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
};

/* ================================================================
   MOBILE MENU
   ================================================================ */
const initMobileMenu = () => {
  const toggle = qs("#menu-toggle");
  const menu = qs("#mobile-menu");
  const links = qsa(".mobile-nav-link", menu);
  if (!toggle || !menu) return;

  let isOpen = false;

  const openMenu = () => {
    isOpen = true;
    document.body.classList.add("menu-open");
    menu.classList.add("open");
    menu.setAttribute("aria-hidden", "false");

    links.forEach((link, i) => {
      link.style.transition = `
        transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.07 + 0.15}s,
        opacity   0.5s ease                        ${i * 0.07 + 0.15}s
      `;
    });
  };

  const closeMenu = () => {
    isOpen = false;
    document.body.classList.remove("menu-open");
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
  };

  toggle.addEventListener("click", () => (isOpen ? closeMenu() : openMenu()));

  links.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeMenu();
  });
};

/* ================================================================
   HERO COUNTER ANIMATION
   ================================================================ */
const initCounters = () => {
  const counters = qsa("[data-target]");
  if (!counters.length) return;

  const formatNum = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
    return n.toString();
  };

  const animateCounter = (el, target) => {
    const duration = 2000;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      const current = Math.round(eased * target);
      el.textContent = formatNum(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((counter) => observer.observe(counter));
};

/* ================================================================
   SCROLL REVEAL — Story Cards
   ================================================================ */
const initScrollReveal = () => {
  const cards = qsa(".story-card");
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, _) => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        const index = cards.indexOf(card);
        setTimeout(
          () => {
            card.classList.add("visible");
          },
          (index % 3) * 80,
        );
        observer.unobserve(card);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );

  cards.forEach((card) => observer.observe(card));
};

/* ================================================================
   GSAP ANIMATIONS (when GSAP is loaded)
   ================================================================ */
const initGSAP = () => {
  if (typeof gsap === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  /* Featured card parallax */
  const featImg = qs(".featured-image");
  if (featImg) {
    gsap.to(featImg, {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: "#featured",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  /* Quote section reveal */
  const quoteText = qs(".quote-text");
  const quoteAuth = qs(".quote-author");
  if (quoteText) {
    gsap.fromTo(
      quoteText,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#quote-interlude",
          start: "top 70%",
        },
      },
    );
  }
  if (quoteAuth) {
    gsap.fromTo(
      quoteAuth,
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#quote-interlude",
          start: "top 70%",
        },
      },
    );
  }

  /* Submit section reveal */
  const submitText = qs(".submit-text");
  const submitVis = qs(".submit-visual");
  if (submitText) {
    gsap.fromTo(
      submitText,
      { opacity: 0, x: -40 },
      {
        opacity: 1,
        x: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: "#submit", start: "top 65%" },
      },
    );
  }
  if (submitVis) {
    gsap.fromTo(
      submitVis,
      { opacity: 0, x: 40, rotateY: 10 },
      {
        opacity: 1,
        x: 0,
        rotateY: 0,
        duration: 1.2,
        delay: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: "#submit", start: "top 65%" },
      },
    );
  }

  /* Categories stagger */
  gsap.fromTo(
    ".cat-card",
    { opacity: 0, y: 20, scale: 0.95 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      stagger: 0.08,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: "#categories", start: "top 70%" },
    },
  );
};

/* ================================================================
   FILTER BUTTONS
   ================================================================ */
const initFilters = () => {
  const btns = qsa(".filter-btn");
  const cards = qsa(".story-card");
  if (!btns.length) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      // Optionally: filter cards by data-category here
      // For now just visual state (backend will handle real filtering)
    });
  });
};

/* ================================================================
   BACK TO TOP
   ================================================================ */
const initBackToTop = () => {
  const btn = qs("#back-to-top");
  if (!btn) return;

  window.addEventListener(
    "scroll",
    () => {
      btn.classList.toggle("visible", window.scrollY > 500);
    },
    { passive: true },
  );

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

/* ================================================================
   NEWSLETTER FORM
   ================================================================ */
const initNewsletter = () => {
  const form = qs("#newsletter-form");
  const input = form?.querySelector(".newsletter-input");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = input?.value.trim();
    if (!email) return;

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Inscrito!';
    btn.disabled = true;
    btn.style.background = "#1a5c1a";
    input.value = "";

    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      btn.style.background = "";
    }, 3000);
  });
};

/* ================================================================
   LOAD MORE (placeholder)
   ================================================================ */
const initLoadMore = () => {
  const btn = qs("#load-more");
  const grid = qs("#stories-grid");
  if (!btn || !grid) return;

  let loading = false;

  btn.addEventListener("click", async () => {
    if (loading) return;
    loading = true;
    const original = btn.innerHTML;
    btn.innerHTML =
      '<i class="fa-solid fa-circle-notch fa-spin"></i> Carregando...';

    /* Simulate network delay — replace with real fetch to your servlet */
    await new Promise((r) => setTimeout(r, 1200));

    /* Re-enable — servlet will inject real cards */
    btn.innerHTML = original;
    loading = false;
  });
};

/* ================================================================
   FEATURED CARD — Hover blood glow effect
   ================================================================ */
const initFeaturedHover = () => {
  const card = qs("#featured-story");
  if (!card) return;

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--mouse-x", `${x}%`);
    card.style.setProperty("--mouse-y", `${y}%`);
  });
};

/* ================================================================
   PAGE ENTER ANIMATION
   ================================================================ */
const initPageEntrance = () => {
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.5s ease";

  const reveal = () =>
    requestAnimationFrame(() => {
      document.body.style.opacity = "1";
    });

  /* Com scripts defer, window.load pode ja ter disparado antes
     deste listener ser registrado — checamos readyState primeiro */
  if (document.readyState === "complete") {
    reveal();
  } else {
    window.addEventListener("load", reveal, { once: true });
  }
};

/* ================================================================
   SMOOTH ANCHOR LINKS
   ================================================================ */
const initSmoothAnchors = () => {
  qsa('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = qs(anchor.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
};

/* ================================================================
   HEART BUTTON — LIKE TOGGLE
   ================================================================ */
const initLikeButtons = () => {
  qsa(".icon-action").forEach((btn) => {
    if (!btn.querySelector(".fa-heart")) return;
    let liked = false;

    btn.addEventListener("click", () => {
      liked = !liked;
      const icon = btn.querySelector("i");
      const count = btn.querySelector("span");
      const num = parseInt(count.textContent.replace(",", ""), 10);

      if (liked) {
        icon.className = "fa-solid fa-heart";
        icon.style.color = "#c0192a";
        count.textContent = (num + 1).toLocaleString();

        /* Burst animation */
        btn.style.transform = "scale(1.3)";
        setTimeout(() => {
          btn.style.transform = "";
        }, 200);
      } else {
        icon.className = "fa-regular fa-heart";
        icon.style.color = "";
        count.textContent = num.toLocaleString();
      }
    });
  });
};

/* ================================================================
   CATEGORY TAG HOVER COLOR
   ================================================================ */
const initCategoryColors = () => {
  const colorMap = {
    Sobrenatural: "#6b0000",
    Psicológico: "#4a006b",
    Slasher: "#6b1500",
    Creepypasta: "#005050",
    Cósmico: "#15006b",
    Folclore: "#1a5000",
  };

  qsa(".story-card-cat").forEach((tag) => {
    const color = colorMap[tag.textContent.trim()];
    if (color) {
      tag.style.setProperty("--tag-color", color);
    }
  });
};

/* ================================================================
   INIT ALL
   ================================================================ */
const init = () => {
  initPageEntrance();
  initCursor();
  initParticles();
  initHeader();
  initMobileMenu();
  initCounters();
  initScrollReveal();
  initFilters();
  initBackToTop();
  initNewsletter();
  initLoadMore();
  initFeaturedHover();
  initSmoothAnchors();
  initLikeButtons();
  initCategoryColors();

  /* GSAP loads async — wait for it */
  const gsapReady = setInterval(() => {
    if (typeof gsap !== "undefined") {
      clearInterval(gsapReady);
      initGSAP();
    }
  }, 100);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
