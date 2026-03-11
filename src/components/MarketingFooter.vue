<!-- src/components/MarketingFooter.vue -->
<template>
  <footer class="mk-footer" role="contentinfo">
    <div class="mk-footer__bg"></div>

    <div class="mk-footer__inner">
      <!-- Brand -->
      <div class="mk-footer__brand">
        <RouterLink to="/" class="mk-footer__logo" aria-label="Retour à l’accueil SunBassSchool">
          <img src="/logo.png" alt="SunBassSchool" class="mk-footer__logoIcon" />
          <span class="mk-footer__logoText">SunBass.School</span>
        </RouterLink>

        <p class="mk-footer__tagline">
          Cours de basse en ligne · méthode structurée · suivi sur SunBassApp
        </p>

        <div class="mk-footer__badges">
          <span class="mk-badge">🎸 Professeur pro</span>
          <span class="mk-badge">✅ Replay & feedback</span>
          <span class="mk-badge">📍 France</span>
        </div>
      </div>

      <!-- Links -->
      <nav class="mk-footer__nav" aria-label="Navigation du pied de page">
        <div class="mk-col">
          <p class="mk-col__title">Découvrir</p>
          <RouterLink to="/cours-de-basse-en-ligne" class="mk-link">Cours en ligne</RouterLink>
          <RouterLink to="/apprendre-la-basse" class="mk-link">Apprendre la basse</RouterLink>
          <RouterLink to="/masterclass" class="mk-link">Masterclass gratuite</RouterLink>
          <RouterLink to="/improvisationcadentielle" class="mk-link">Improvisation</RouterLink><br />
          <RouterLink to="/modules-basse" class="mk-link">Formations</RouterLink>
        </div>

        <div class="mk-col">
          <p class="mk-col__title">Contact</p>
          <a class="mk-link" :href="`mailto:${email}`">{{ email }}</a>
          <a class="mk-link" :href="siteUrl" target="_blank" rel="noopener">Site</a>
          <RouterLink to="/register" class="mk-link is-cta">Accéder à SunBassApp</RouterLink>
        </div>

        <div class="mk-col">
          <p class="mk-col__title">Réseaux</p>

          <div class="mk-social">
            <a
              v-for="s in socials"
              :key="s.name"
              class="mk-social__btn"
              :href="s.url"
              target="_blank"
              rel="me noopener"
              :aria-label="`Ouvrir ${s.name}`"
              :title="s.name"
            >
              <span class="mk-social__icon" v-html="s.svg"></span>
              <span class="mk-social__text">{{ s.name }}</span>
            </a>
          </div>
        </div>
      </nav>
    </div>

    <div class="mk-footer__bottom">
      <div class="mk-footer__bottomInner">
        <p class="mk-muted">
          © {{ year }} SunBassSchool — Tous droits réservés.
        </p>

        <div class="mk-footer__legal">
<a class="mk-legal" @click.prevent="openModal('mentions')">Mentions légales</a>
          <span class="mk-dot">•</span>
<a class="mk-legal" @click.prevent="openModal('privacy')">Confidentialité</a>
          <span class="mk-dot">•</span>
<a class="mk-legal" @click.prevent="openModal('cgv')">CGV</a>
        </div>
      </div>
    </div>

<LegalModal
  :open="modalOpen"
  :type="modalType"
  @close="modalOpen = false"
/>

  </footer>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import LegalModal from "@/components/LegalModal.vue"

import { useHead } from "@vueuse/head"



const modalOpen = ref(false)
const modalType = ref<"mentions" | "privacy" | "cgv">("mentions")

const openModal = (type: typeof modalType.value) => {
  modalType.value = type
  modalOpen.value = true
}
const year = new Date().getFullYear()

// ✅ mets tes vrais liens ici
const email = "contact@sunbassschool.com"
const siteUrl = "https://www.sunbassschool.com"

// REMPLACE les URLs par tes vrais profils
const socials = [
  {
    name: "YouTube",
    url: "https://www.youtube.com/@SunBassSchool",
    svg: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21.6 7.2c.2 1 .4 2.3.4 4.8s-.2 3.8-.4 4.8c-.2.9-.9 1.6-1.8 1.8-1.6.4-7.8.4-7.8.4s-6.2 0-7.8-.4c-.9-.2-1.6-.9-1.8-1.8C2.2 15.8 2 14.5 2 12s.2-3.8.4-4.8c.2-.9.9-1.6 1.8-1.8C5.8 5 12 5 12 5s6.2 0 7.8.4c.9.2 1.6.9 1.8 1.8Z" stroke="currentColor" stroke-width="1.4"/><path d="M10 15.2V8.8L15.6 12 10 15.2Z" fill="currentColor"/></svg>`
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/sunbassschool/",
    svg: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6A5.2 5.2 0 0 1 16.8 22H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Z" stroke="currentColor" stroke-width="1.4"/><path d="M12 16.2A4.2 4.2 0 1 0 12 7.8a4.2 4.2 0 0 0 0 8.4Z" stroke="currentColor" stroke-width="1.4"/><path d="M17.6 6.4h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/p/Sunbassschool-100092339507017/",
    svg: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 8.5V7.2c0-.7.5-1.2 1.2-1.2H17V3h-2.2C12.7 3 11 4.7 11 6.8v1.7H9v3h2V21h3v-9.5h2.4l.6-3H14Z" fill="currentColor"/></svg>`
  },
  {
  name: "TikTok",
  url: "https://www.tiktok.com/@sunbassschool",
  svg: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14 3v10.2a3.8 3.8 0 1 1-3-3.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M14 3c.6 2.2 2.3 3.7 4.5 4v2.4c-1.7-.1-3.3-.7-4.5-1.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`
}

]

// JSON-LD ultra simple : adapte "sameAs" avec tes vrais liens
const jsonLd = computed(() =>
  JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "SunBassSchool",
      url: siteUrl,
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email
        }
      ],
      sameAs: socials.map(s => s.url)
    },
    null,
    0
  )
)

useHead({
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "SunBassSchool",
        url: "https://www.sunbassschool.com",
        sameAs: socials.map(s => s.url),
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email
          }
        ]
      })
    }
  ]
})
</script>

<style scoped>
.mk-footer {
  position: relative;
  margin-top: 3.5rem;
  padding: 3.2rem 1.2rem 0;
  background: #0b0b0f;
  color: #f8fafc;
  overflow: hidden;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.mk-footer__bg {
  position: absolute;
  inset: -120px -120px auto -120px;
  height: 340px;
  background:
    radial-gradient(700px 280px at 20% 40%, rgba(245,158,11,0.10), transparent 65%),
    radial-gradient(700px 280px at 80% 20%, rgba(99,102,241,0.08), transparent 60%);
  filter: blur(0px);
  pointer-events: none;
}

.mk-footer__inner {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 1.9fr;
  gap: 2.2rem;
  align-items: start;
}

.mk-footer__brand {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.mk-footer__logo {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  text-decoration: none;
  color: #f8fafc;
  font-weight: 900;
}

.mk-footer__logoIcon {
  width: 30px;
  height: 30px;
  object-fit: contain;
  display: block;
}

.mk-footer__logoText {
  font-size: 1.05rem;
  letter-spacing: -0.01em;
}

.mk-footer__tagline {
  margin: 0;
  color: rgba(255,255,255,0.70);
  line-height: 1.6;
  max-width: 420px;
}

.mk-footer__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.mk-badge {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 0.78rem;
  color: rgba(255,255,255,0.78);
}

.mk-footer__nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.6rem;
}

.mk-col__title {
  margin: 0 0 0.8rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.85);
  text-transform: uppercase;
}

.mk-link {
  display: inline-flex;
  text-decoration: none;
  color: rgba(255,255,255,0.70);
  font-weight: 650;
  margin: 0.45rem 0;
  transition: color 0.2s ease;
}

.mk-link:hover {
  color: #f59e0b;
}

.mk-link.is-cta {
  margin-top: 0.7rem;
  padding: 0.65rem 0.9rem;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06));
  border: 1px solid rgba(245,158,11,0.35);
  color: #fbbf24;
}

.mk-social {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.mk-social__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  border-radius: 14px;
  text-decoration: none;
  color: rgba(255,255,255,0.78);
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  transition: transform 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.mk-social__btn:hover {
  transform: translateY(-2px);
  border-color: rgba(245,158,11,0.35);
  color: #f8fafc;
}

.mk-social__icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  color: #fbbf24;
}

.mk-social__icon :deep(svg) {
  width: 18px;
  height: 18px;
  display: block;
}

.mk-social__text {
  font-weight: 750;
  font-size: 0.9rem;
}

.mk-footer__bottom {
  margin-top: 2.2rem;
  border-top: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
}

.mk-footer__bottomInner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.1rem 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.mk-muted {
  margin: 0;
  color: rgba(255,255,255,0.55);
  font-size: 0.85rem;
}

.mk-footer__legal {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.mk-legal {
  text-decoration: none;
  color: rgba(255,255,255,0.60);
  font-weight: 650;
  font-size: 0.85rem;
}

.mk-legal:hover {
  color: #f59e0b;
}

.mk-dot {
  color: rgba(255,255,255,0.25);
}

@media (max-width: 980px) {
  .mk-footer__inner {
    grid-template-columns: 1fr;
  }
  .mk-footer__nav {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 620px) {
  .mk-footer__nav {
    grid-template-columns: 1fr;
  }
}

.mk-legal {
  text-decoration: none;
  color: rgba(255,255,255,0.60);
  font-weight: 650;
  font-size: 0.85rem;
  cursor: pointer;          /* ← AJOUTE ÇA */
}

.mk-legal:hover {
  color: #f59e0b;
}
.mk-legal {
  transition: color 0.2s ease;
}

</style>
