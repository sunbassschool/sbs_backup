<template>
  <RouterLink
    to="/eleve/offres"
    class="cta-reserver"
  >
    Réserver un cours
  </RouterLink>
</template>
<style scoped>
.cta-reserver {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0.8rem 1.4rem;
  border-radius: 999px;

  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.3px;

  background: linear-gradient(135deg, #ffffff, #eaeaea);
  color: #000;

  text-decoration: none;
  box-shadow:
    0 4px 10px rgba(0,0,0,.25),
    inset 0 1px 0 rgba(255,255,255,.6);

  transition: transform .12s ease, box-shadow .12s ease, opacity .12s ease;
}

.cta-reserver:hover {
  transform: translateY(-1px);
  box-shadow:
    0 6px 14px rgba(0,0,0,.35),
    inset 0 1px 0 rgba(255,255,255,.7);
}

.cta-reserver:active {
  transform: translateY(0);
  box-shadow:
    0 3px 6px rgba(0,0,0,.3),
    inset 0 2px 4px rgba(0,0,0,.15);
}

.cta-reserver:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(255,255,255,.6),
    0 0 0 4px rgba(0,0,0,.8);
}

</style>
