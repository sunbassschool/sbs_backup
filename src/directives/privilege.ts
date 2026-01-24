import { useAuthStore } from "@/stores/authStore.js"
import type { DirectiveBinding } from "vue"

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    const auth = useAuthStore()
    const required = binding.value

    const hasPrivilege = auth.user?.privileges?.includes(required)

    if (!hasPrivilege) {
      el.classList.add("locked")
      el.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault()
        e.stopImmediatePropagation()
        auth.showUpgradeCTA({ privilege: required })
      })
    }
  }
}
