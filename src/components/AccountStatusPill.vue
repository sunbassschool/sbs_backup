<template>
  <div v-if="isLoggedIn && !isMobile" class="account-info-block">
    <div class="cta_header">

      <!-- CTA PROF -->
      <router-link
        v-if="!hasPrivileges && user?.role === 'prof'"
        :to="{ name: 'pricing' }"
        class="sub-pill cta"
      >
        Passer Premium
      </router-link>

      <!-- INFO ÉLÈVE -->
      <router-link
        v-else-if="!hasPrivileges && user && !['prof','admin'].includes(user.role)"
        to="/eleve/offres"
        class="sub-pill cta"
      >
        Non abonné
      </router-link>

      <!-- PREMIUM -->
      <span
        v-else-if="hasPrivileges && isPro"
        class="sub-pill pro"
      >
        ⭐ Premium
      </span>

      <!-- ABONNÉ -->
      <span
        v-else-if="hasPrivileges"
        class="sub-pill subscriber"
      >
        Abonné
      </span>

    </div>
  </div>
</template>

<script setup>
defineProps({
  isLoggedIn: Boolean,
  isMobile: Boolean,
  hasPrivileges: Boolean,
  isPro: Boolean,
  user: Object
})
</script>
<style scoped>
.account-info-block {
  display: flex;
  align-items: center;
}

.cta_header {
  display: flex;
  gap: 8px;
}

/* Base pill */
.sub-pill {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

/* CTA */
.sub-pill.cta {
  background: var(--accent, #ff9800);
  color: #000;
  text-decoration: none;
}

/* Premium */
.sub-pill.pro {
  background: linear-gradient(135deg, gold, orange);
  color: #000;
}

/* Abonné */
.sub-pill.subscriber {
  background: #2ecc71;
  color: #000;
}
</style>
