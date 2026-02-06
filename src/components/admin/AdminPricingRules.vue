<template>
  <div class="pricing-admin">

    <!-- HEADER -->
    <div class="pricing-header">
      <div>
        <h1>Pricing SBS</h1>
        <p>Règles de frais appliquées aux paiements</p>
      </div>

      <button class="btn-create" @click="openCreate">
        + Nouvelle règle
      </button>
    </div>

    <!-- LISTE DES RÈGLES -->
    <div class="rules-list">
      <div
        v-for="r in rules"
        :key="r.rule_id"
        class="rule-card"
        :class="{ disabled: !r.enabled }"
      >
        <div class="rule-top">
          <span class="badge scope">{{ r.scope }}</span>
          <span class="badge type">{{ r.fee_type }}</span>
        </div>

        <div class="rule-main">
          <div class="rule-value">
{{ r.fee_type === 'percent'
  ? r.fee_value
  : (r.fee_value / 100).toFixed(2)
}}

            <span class="unit">{{ r.fee_type === 'percent' ? '%' : '€' }}</span>
          </div>

          <div class="rule-meta">
            <div><strong>Target</strong> {{ r.target_id || '—' }}</div>
            <div><strong>Priorité</strong> {{ r.priority }}</div>
          </div>
        </div>

        <div class="rule-actions">
          <label class="toggle">
            <input type="checkbox" v-model="r.enabled" @change="toggleRule(r)" />
            <span />
          </label>

          <button class="icon-btn" @click="editRule(r)">✏️</button>
          <button class="icon-btn danger" @click="deleteRule(r)">🗑</button>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-card">
        <h2>{{ editing ? "Modifier" : "Créer" }} une règle</h2>

        <label>Scope</label>
        <select v-model="form.scope">
          <option value="global">global</option>
          <option value="prof">prof</option>
          <option value="product">product</option>
        </select>

        <label>Target</label>
        <input v-model="form.target_id" placeholder="one_time / subscription / id" />

        <label>Type</label>
        <select v-model="form.fee_type">
          <option value="fixed">fixed</option>
          <option value="percent">percent</option>
        </select>

        <label>Valeur</label>
        <input type="number" v-model.number="form.fee_value" />

        <label>Priorité</label>
        <input type="number" v-model.number="form.priority" />

        <label class="checkbox">
          <input type="checkbox" v-model="form.enabled" />
          active
        </label>

        <div class="actions">
          <button class="btn-primary" @click="saveRule">💾 Enregistrer</button>
          <button class="btn-secondary" @click="closeModal">Annuler</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import axios from "axios"
import { getProxyPostURL } from "@/config/gas"

const rules = ref([])
const showModal = ref(false)
const editing = ref(false)

const emptyForm = {
  rule_id: null,
  scope: "global",
  target_id: "",
  fee_type: "fixed",
  fee_value: 0,
  priority: 1,
  enabled: true
}

const form = ref({ ...emptyForm })

const loadRules = async () => {
  const res = await axios.post(getProxyPostURL(), {
    route: "listPricingRules"
  })
  rules.value = res.data.rules || []
}

const openCreate = () => {
  editing.value = false
  form.value = { ...emptyForm }
  showModal.value = true
}

const editRule = (r) => {
  editing.value = true
  form.value = { ...r }
  showModal.value = true
}

const saveRule = async () => {
  if (editing.value) {
    await axios.post(getProxyPostURL(), {
      route: "updatePricingRule",
      rule_id: form.value.rule_id,
      patch: form.value
    })
  } else {
    await axios.post(getProxyPostURL(), {
      route: "createPricingRule",
      rule: form.value
    })
  }

  closeModal()
  loadRules()
}

const toggleRule = async (r) => {
  await axios.post(getProxyPostURL(), {
    route: "updatePricingRule",
    rule_id: r.rule_id,
    patch: { enabled: r.enabled }
  })
}

const deleteRule = async (r) => {
  if (!confirm("Supprimer cette règle ?")) return
  await axios.post(getProxyPostURL(), {
    route: "deletePricingRule",
    rule_id: r.rule_id
  })
  loadRules()
}

const closeModal = () => {
  showModal.value = false
}

onMounted(loadRules)
</script>
<style scoped>

/* =====================================================
   SBS – Pricing Admin (Dark Premium)
   ===================================================== */

.pricing-admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 14px 40px;
  color: #fff;
}

/* HEADER */
.pricing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 24px;
}

.pricing-header h1 {
  font-size: 1.3rem;
  font-weight: 700;
}

.pricing-header p {
  margin-top: 6px;
  font-size: .85rem;
  color: rgba(255,255,255,.55);
}

.btn-create {
  background: rgba(255,160,60,.9);
  border: none;
  border-radius: 12px;
  padding: 8px 14px;
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  color: #000;
}

/* LIST */
.rules-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 768px) {
  .rules-list {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

/* CARD */
.rule-card {
  background: linear-gradient(
    180deg,
    rgba(255,255,255,.07),
    rgba(255,255,255,.015)
  );
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-card.disabled {
  opacity: .45;
}

/* TOP */
.rule-top {
  display: flex;
  gap: 8px;
}

.badge {
  font-size: .65rem;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.12);
  text-transform: uppercase;
}

.badge.scope {
  border-left: 3px solid rgba(255,160,60,.9);
}

.badge.type {
  border-left: 3px solid rgba(80,180,255,.9);
}

/* MAIN */
.rule-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.rule-value {
  font-size: 1.2rem;
  font-weight: 700;
}

.rule-value .unit {
  font-size: .75rem;
  opacity: .6;
  margin-left: 2px;
}

.rule-meta {
  font-size: .75rem;
  opacity: .7;
  line-height: 1.4;
}

/* ACTIONS */
.rule-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: .9rem;
  opacity: .7;
}

.icon-btn:hover {
  opacity: 1;
}

.icon-btn.danger {
  color: rgba(255,80,80,.9);
}

/* TOGGLE */
.toggle {
  position: relative;
}

.toggle input {
  display: none;
}

.toggle span {
  width: 34px;
  height: 18px;
  background: rgba(255,255,255,.25);
  border-radius: 999px;
  position: relative;
  display: inline-block;
}

.toggle span::after {
  content: "";
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform .15s ease;
}

.toggle input:checked + span {
  background: rgba(255,160,60,.9);
}

.toggle input:checked + span::after {
  transform: translateX(16px);
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-card {
  width: 100%;
  max-width: 360px;
  background: #121212;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 18px;
  padding: 20px;
}

.modal-card h2 {
  font-size: 1.05rem;
  margin-bottom: 14px;
}

.modal-card label {
  display: block;
  font-size: .7rem;
  opacity: .65;
  margin: 10px 0 4px;
}

.modal-card input,
.modal-card select {
  width: 100%;
  background: rgba(0,0,0,.5);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;
  padding: 8px 10px;
  color: #fff;
}

.checkbox {
  margin-top: 10px;
  font-size: .75rem;
}

/* MODAL ACTIONS */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.btn-primary {
  background: rgba(255,160,60,.9);
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  color: #000;
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: .8rem;
  color: #fff;
}


</style>
