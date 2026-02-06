import { useAuthStore } from "@/stores/authStore.js"
import type { DirectiveBinding } from "vue"

type PrivilegeEl = HTMLElement & {
  _privilegeCleanup?: () => void
}

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    const auth = useAuthStore()
    const required = binding.value
    const elTyped = el as PrivilegeEl

    const onClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      auth.showUpgradeCTA({ privilege: required })
    }

    const apply = () => {
      const hasPrivilege = auth.user?.privileges?.includes(required)

      if (!hasPrivilege) {
        el.classList.add("locked")
        el.addEventListener("click", onClick, true)
      } else {
        el.classList.remove("locked")
        el.removeEventListener("click", onClick, true)
      }
    }

    apply()
    elTyped._privilegeCleanup = auth.$subscribe(apply)
  },

  unmounted(el: HTMLElement) {
    ;(el as PrivilegeEl)._privilegeCleanup?.()
  }
}
