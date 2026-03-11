<script setup lang="ts">
import { useHead } from "@vueuse/head"
import MarketingHeader from "@/components/MarketingHeader.vue"
import { ref, computed } from "vue"
import MarketingFooter from "@/components/MarketingFooter.vue"

const search = ref("")
type Module = {
  title: string
  desc: string
  category: string
  url: string
  price?: string
  features?: string[]
}
const modules: Module[] = [
  {
    title: "Routine main gauche",
    desc: "Routine technique de 20 minutes pour retrouver la précision et l'indépendance des doigts afin d'être complètement à l'aise sur le manche.",
    category: "technique",
    price: "7,99 €",
    url: "/routine-main-gauche"
  },
  {
    title: "Routine main droite",
    desc: "Routine de 20 minutes pour améliorer la régularité, l'attaque et le contrôle de ta main droite.",
    category: "technique",
    price: "7,99 €",
    url: "/routine-main-droite"
  },
  {
    title: "Improvisation cadentielle",
    desc: "Mode d'emploi pour construire des solos mélodiques et cohérents.",
    category: "musicalite",
    url: "/improvisationcadentielle"
  }
]

const filteredModules = computed(() => {
  if (!search.value) return modules

  return modules.filter(m =>
    m.title.toLowerCase().includes(search.value.toLowerCase())
  )
})
useHead({
  title: "Modules pédagogiques basse – routines techniques et improvisation | SunBassSchool",
  meta: [
    {
      name: "description",
      content:
        "Modules pédagogiques pour bassistes : routines main gauche, routine main droite et méthode d’improvisation cadentielle. Travail technique et musical structuré."
    }
  ],
  link: [
    {
      rel: "canonical",
      href: "https://www.sunbassschool.com/modules-basse"
    }
  ]
})

</script>

<template>
  <MarketingHeader />

  <main class="modules-page">

    <!-- HERO -->
    <section class="hero">
      <span class="badge">Modules pédagogiques</span>

      <h1>
        Modules pour
        <span class="accent">progresser à la basse</span>
      </h1>

      <p class="intro">
        Des routines courtes et structurées pour développer la technique,
        le contrôle de l’instrument et la musicalité.
      </p>
    </section>

    <!-- SEARCH -->
    <section class="modules-search">
      <input
        v-model="search"
        type="text"
        placeholder="Rechercher un module..."
      />
    </section>

    <!-- TAGS -->
    <section class="modules-tags">
      <a href="#technique" class="tag">Technique</a>
      <a href="#bundle" class="tag">Pack</a>
      <a href="#musicalite" class="tag">Improvisation</a>
    </section>

    <!-- TECHNIQUE -->
    <section id="technique" class="category">
      <h2 class="category-title">Technique</h2>

      <div class="modules-grid">

        <article
          v-for="module in filteredModules.filter(m => m.category === 'technique')"
          :key="module.title"
          class="module-card"
        >
          <h3>{{ module.title }}</h3>

          <p class="desc">
            {{ module.desc }}
          </p>

          <ul v-if="module.features" class="features">
            <li v-for="f in module.features" :key="f">
              {{ f }}
            </li>
          </ul>

          <div v-if="module.price" class="price">
            {{ module.price }}
          </div>

          <RouterLink
            :to="module.url"
            class="cta"
          >
            Voir le module
          </RouterLink>
        </article>

      </div>
    </section>

    <!-- BUNDLE -->
    <section id="bundle" class="bundle-section">

      <div class="bundle-card">

        <span class="bundle-badge">
          Offre recommandée
        </span>

        <h2>Routine complète des mains</h2>

        <p class="bundle-desc">
          Combine les routines main gauche et main droite
          pour construire une technique stable et équilibrée.
        </p>

        <div class="bundle-content">

          <div class="bundle-module">
            Routine main gauche
          </div>

          <div class="bundle-plus">+</div>

          <div class="bundle-module">
            Routine main droite
          </div>

        </div>

        <div class="bundle-price">

          <span class="old-price">
            15,98 €
          </span>

          <span class="new-price">
            12,99 €
          </span>

        </div>

        <RouterLink
          to="/bundle-routine-mains"
          class="bundle-cta"
        >
          Accéder au pack
        </RouterLink>

      </div>

    </section>

    <!-- MUSICALITÉ -->
    <section id="musicalite" class="category">

      <h2 class="category-title">Musicalité</h2>

      <div class="modules-grid single">

        <article
          v-for="module in filteredModules.filter(m => m.category === 'musicalite')"
          :key="module.title"
          class="module-card"
        >

          <span class="badge-advanced">
            Module avancé
          </span>

          <h3>{{ module.title }}</h3>

          <p class="desc">
            {{ module.desc }}
          </p>

          <ul v-if="module.features" class="features">
            <li v-for="f in module.features" :key="f">
              {{ f }}
            </li>
          </ul>

          <RouterLink
            :to="module.url"
            class="cta"
          >
            Découvrir le module
          </RouterLink>

        </article>

      </div>

    </section>

  </main>
  <MarketingFooter />

</template>
<style scoped>

.modules-page {
  background: radial-gradient(1200px 600px at 50% -10%, #000000, #0b0b0f);
  color: #f8fafc;
  min-height: 100vh;
  padding: 4rem 1.2rem;
}

/* HERO */

.hero {
  max-width: 820px;
  margin: 0 auto 3.5rem;
  text-align: center;
}

.badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(245,158,11,0.35);
  color: #f59e0b;
  font-size: 0.75rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.hero h1 {
  font-size: clamp(2rem,4vw,2.6rem);
  font-weight: 900;
}

.accent {
  color: #f59e0b;
}

.intro {
  margin-top: 1rem;
  color: #9ca3af;
  max-width: 640px;
  margin-inline: auto;
}

/* CATEGORY */

.category {
  max-width: 1000px;
  margin: 0 auto 4rem;
}

.category-title {
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 1.6rem;
}

/* GRID */

.modules-grid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 2rem;
}

.modules-grid.single {
  grid-template-columns: 1fr;
}

/* CARD */

.module-card {
  background: #13131a;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 2rem;
  position: relative;
}

.module-card h3 {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 0.6rem;
}

.desc {
  color: #9ca3af;
  margin-bottom: 1rem;
}

.features {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.features li {
  margin-bottom: 0.4rem;
}

.price {
  font-size: 1.4rem;
  font-weight: 900;
  margin-bottom: 1rem;
}

/* CTA */

.cta {
  display: inline-block;
  padding: 0.65rem 1.4rem;
  border-radius: 999px;
  background: linear-gradient(135deg,#fbbf24,#f59e0b);
  color: #111;
  font-weight: 900;
  text-decoration: none;
}

/* BUNDLE */

.bundle {
  max-width: 900px;
  margin: 3rem auto 4rem;
}

.bundle-card {
  background: rgba(245,158,11,0.06);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 22px;
  padding: 2.6rem;
  text-align: center;
}

.bundle-badge {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(245,158,11,0.35);
  color: #f59e0b;
  font-size: 0.7rem;
  font-weight: 800;
  margin-bottom: 0.8rem;
}

.bundle-price {
  font-size: 1.7rem;
  font-weight: 900;
  margin: 1rem 0;
}

.cta-bundle {
  padding: 0.75rem 1.6rem;
  border-radius: 999px;
  background: linear-gradient(135deg,#fbbf24,#f59e0b);
  color: #111;
  font-weight: 900;
  text-decoration: none;
}

.bundle-features {
  font-size: 0.9rem;
  margin-top: 1rem;
}

.bundle-features li {
  margin-bottom: 0.4rem;
}

/* ADVANCED BADGE */

.badge-advanced {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 0.7rem;
  font-weight: 800;
  color: #f59e0b;
  border: 1px solid rgba(245,158,11,0.4);
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
}

/* RESPONSIVE */

@media (max-width: 820px) {

  .modules-grid {
    grid-template-columns: 1fr;
  }

}


.modules-search {
  max-width: 600px;
  margin: 0 auto 1rem;
}

.modules-search input {
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: #13131a;
  color: white;
}

.modules-tags {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.35rem 0.7rem;
  font-size: 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(245,158,11,0.35);
  color: #f59e0b;
  text-decoration: none;
}

.bundle-section{
  max-width:1000px;
  margin:4rem auto;
}

.bundle-card{

  background: linear-gradient(
    180deg,
    rgba(245,158,11,0.12),
    rgba(245,158,11,0.05)
  );

  border:1px solid rgba(245,158,11,0.35);

  border-radius:24px;

  padding:3rem 2rem;

  text-align:center;

}

.bundle-badge{

  font-size:0.7rem;
  font-weight:800;

  padding:0.3rem 0.7rem;

  border-radius:999px;

  border:1px solid rgba(245,158,11,0.45);

  color:#f59e0b;

}

.bundle-content{

  display:flex;
  justify-content:center;
  align-items:center;
  gap:1rem;

  margin:2rem 0;

}

.bundle-module{

  padding:0.8rem 1.2rem;

  border-radius:12px;

  background:#13131a;

  border:1px solid rgba(255,255,255,0.1);

}

.bundle-plus{

  font-size:1.6rem;
  font-weight:900;
  color:#f59e0b;

}

.bundle-price{

  margin-top:1rem;

}

.old-price{

  text-decoration:line-through;
  color:#9ca3af;
  margin-right:0.6rem;

}

.new-price{

  font-size:1.8rem;
  font-weight:900;

}

.bundle-cta{

  margin-top:1.2rem;

  display:inline-block;

  padding:0.8rem 1.6rem;

  border-radius:999px;

  background:linear-gradient(
    135deg,
    #fbbf24,
    #f59e0b
  );

  color:#111;
  font-weight:900;

  text-decoration:none;

}
</style>
