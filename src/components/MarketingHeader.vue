<template>
  <header class="marketing-header">

    <RouterLink to="/" class="logo">
      <img src="/logo (2).webp" alt="Teachy.Sbs" class="logo-icon" />
      <span class="logo-text">SunBass.School</span>
    </RouterLink>

    <!-- TOGGLE (DOIT ÊTRE AVANT menu ET overlay) -->
    <input type="checkbox" id="menu-toggle" />

    <!-- BURGER -->
    <label for="menu-toggle" class="burger">
      <span></span>
      <span></span>
      <span></span>
    </label>

    <!-- OVERLAY -->
<div class="menu-overlay" @click="closeIfMobile"></div>

    <!-- MENU -->
<nav class="menu" @click.capture="closeIfMobile">

  <RouterLink to="/cours-de-basse-en-ligne" class="link">
    Cours de basse en ligne
  </RouterLink>

  <RouterLink to="/apprendre-la-basse" class="link">
    Apprendre la basse
  </RouterLink>

<RouterLink to="/masterclass" class="masterclass-link">
  Masterclass basse gratuite
</RouterLink>

    <RouterLink to="/modules-basse" class="link">
    Formations
  </RouterLink>

<RouterLink to="/register" class="btn primary sunbass-btn">
    SunBassApp
  </RouterLink>

</nav>


  </header>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue"

const isMobile = () => window.matchMedia("(max-width: 768px)").matches

const closeMenu = () => {
  const toggle = document.getElementById("menu-toggle")
  if (toggle) toggle.checked = false
}

const onClickOutside = (e) => {
  if (!isMobile()) return

  const header = document.querySelector(".marketing-header")
  if (!header) return

  // clic hors du header → ferme
  if (!header.contains(e.target)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener("click", onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener("click", onClickOutside)
})
</script>



<style>
.masterclass-link{
  animation: introCTA .6s ease;
}

@keyframes introCTA{
  0%{
    transform:scale(.92);
    opacity:0;
  }
  100%{
    transform:scale(1);
    opacity:1;
  }
}
.btn.primary.sunbass-btn{
  background: linear-gradient(135deg,#f59e0b,#fbbf24);
  color:#111;

  box-shadow:0 4px 14px rgba(245,158,11,0.35);

  transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
}

.btn.primary.sunbass-btn:hover{
  transform:translateY(-1px);

  box-shadow:
    0 8px 22px rgba(245,158,11,0.55),
    0 0 12px rgba(245,158,11,0.35);

  filter:brightness(1.08);
}
.masterclass-link{
  position: relative;
  color: #111;
  background: linear-gradient(135deg,#f59e0b,#fbbf24);
  padding: 0.38rem 0.7rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.85rem;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(245,158,11,0.35);
  transition: transform .15s ease, box-shadow .15s ease;
}

/* badge gratuit */
.masterclass-link::before{
  content:"FREE";
  position:absolute;
  top:-6px;
  right:-10px;
  font-size:9px;
  font-weight:900;
  background:#ef4444;
  color:white;
  padding:2px 4px;
  border-radius:4px;
}

/* hover */
.masterclass-link:hover{
  transform:translateY(-1px);
  box-shadow:0 6px 18px rgba(245,158,11,0.45);
}
/* ================= HEADER ================= */

.marketing-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 56px;   /* ← ajuste si besoin */

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0.7rem 1rem;
  background: rgba(11,11,15,0.75);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.08);

  pointer-events: none;

}
.marketing-header a,
.marketing-header button,
.marketing-header label,
.menu,
.menu-overlay {
  pointer-events: auto;
}

.logo {
  font-weight: 900;
  text-decoration: none;
  color: #f8fafc;
  font-size: 0.95rem;
}

/* ================= BURGER ================= */

#menu-toggle {
  display: none;
}

.burger {
  display: none;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}

.burger span {
  width: 22px;
  height: 2px;
  background: #f8fafc;
  border-radius: 2px;
}

/* ================= MENU ================= */

.menu {
  display: flex;
  align-items: center;
  gap: 0.8rem;
    z-index: 90;

}

.link {
  color: #9ca3af;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.link.router-link-active {
  color: #f59e0b;
}

.btn {
  border-radius: 12px;
  padding: 0.5rem 0.9rem;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.9rem;
}

.btn.primary {
  background: #f59e0b;
  color: #000;
}

.btn.full {
  width: 100%;
  text-align: center;
}

/* ================= MOBILE ================= */

@media (max-width: 768px) {

  .burger {
    display: flex;
  }

   .menu {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;

    flex-direction: column;
    gap: 1rem;

    background: #0b0b0f;
    padding: 1.4rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);

    transform: translateY(-120%);
    opacity: 0;
    pointer-events: none;      /* ⬅️ CLÉ */
    transition: transform 0.25s ease, opacity 0.2s ease;
  }

  #menu-toggle:checked ~ .menu {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
}


.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  flex-shrink: 0;              /* ⬅️ IMPORTANT */
}

/* Icône fluide */
.logo-icon {
  width: clamp(22px, 4vw, 28px);
  height: clamp(22px, 4vw, 28px);
  object-fit: contain;
  display: block;
}

/* Texte lisible et qui ne casse pas */
.logo-text {
  font-weight: 900;
  font-size: clamp(0.85rem, 2.5vw, 0.95rem);
  color: #f8fafc;
  white-space: nowrap;         /* ⬅️ évite retour ligne */
}

/* Mobile étroit : on garde texte MAIS plus petit */
@media (max-width: 420px) {
  .logo-text {
    font-size: 0.8rem;
  }
}

/* Très petit écran : icône seule */
@media (max-width: 340px) {
  .logo-text {
    display: none;
  }
}

.menu-overlay {
  position: fixed;
  top: 56px;          /* même hauteur que le header */
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  pointer-events: none;
}


#menu-toggle:checked ~ .menu-overlay {
  pointer-events: auto; /* capte le clic */
}

.menu { z-index: 90; }
.menu-overlay { z-index: 80; }

@media (min-width: 769px) {
  .menu-overlay { display: none; }
}
.menu {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  white-space: nowrap; /* ← CLÉ */
}

.menu .link {
  position: relative;
}

/* séparateur */
.menu .link {
  position: relative;
}

/* barre verticale */
.menu .link:not(.highlight):not(:last-child)::after {
  content: "|";
  margin-left: 0.6rem;
  color: rgba(255,255,255,0.25);
  font-size: 0.8rem;
}


.menu .link:hover {
  color: #f59e0b;
}
.menu .link.router-link-active {
  color: #f59e0b;
}

</style>
