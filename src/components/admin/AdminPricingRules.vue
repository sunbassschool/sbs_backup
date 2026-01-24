<template>
  <div class="pricing-admin">
    <h3>💰 Pricing SBS</h3>

    <button class="btn btn-primary mb-3" @click="openCreate">
      ➕ Nouvelle règle
    </button>

    <table class="table table-dark table-sm">
      <thead>
        <tr>
          <th>Scope</th>
          <th>Target</th>
          <th>Type</th>
          <th>Valeur</th>
          <th>Priorité</th>
          <th>Actif</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rules" :key="r.rule_id">
          <td>{{ r.scope }}</td>
          <td>{{ r.target_id }}</td>
          <td>{{ r.fee_type }}</td>
          <td>{{ r.fee_value }}</td>
          <td>{{ r.priority }}</td>
          <td>
            <input type="checkbox" v-model="r.enabled" @change="toggleRule(r)" />
          </td>
          <td>
            <button class="btn btn-sm btn-outline-light" @click="editRule(r)">✏️</button>
            <button class="btn btn-sm btn-outline-danger ms-1" @click="deleteRule(r)">🗑</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-card">
        <h5>{{ editing ? "Modifier" : "Créer" }} une règle</h5>

        <select v-model="form.scope">
          <option value="global">global</option>
          <option value="prof">prof</option>
          <option value="product">product</option>
        </select>

        <input v-model="form.target_id" placeholder="target_id (one_time / subscription / id)" />

        <select v-model="form.fee_type">
          <option value="fixed">fixed</option>
          <option value="percent">percent</option>
        </select>

        <input type="number" v-model.number="form.fee_value" placeholder="valeur" />
        <input type="number" v-model.number="form.priority" placeholder="priorité" />

        <label>
          <input type="checkbox" v-model="form.enabled" />
          active
        </label>

        <div class="actions">
          <button class="btn btn-success" @click="saveRule">💾</button>
          <button class="btn btn-secondary" @click="closeModal">Annuler</button>
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

.pricing-admin { padding: 20px; color:white;}
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center;
}
.modal-card {
  background: #1e1e1e;
  padding: 20px;
  width: 320px;
  border-radius: 8px;
}
.modal-card input, .modal-card select {
  width: 100%; margin-bottom: 8px;
}
.actions { display: flex; gap: 8px; justify-content: flex-end; }


</style>
