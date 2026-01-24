<template>
  <div class="admin-card" @click="$emit('click')">
    <div class="icon">{{ icon }}</div>
    <div class="content">
      <strong>{{ title }}</strong>
      <p>{{ description }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  icon: String
})
</script>
<style>
  .admin-card {
  background: #1e1e1e;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  display: flex;
  gap: 12px;
  transition: 0.2s;
}
.admin-card:hover {
  background: #2a2a2a;
}
.icon {
  font-size: 28px;
}

</style>
