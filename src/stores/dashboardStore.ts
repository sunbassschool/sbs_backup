import { defineStore } from "pinia"
import { apiFetch } from "@/utils/apiFetch"

const TTL = 15 * 60 * 1000
const CACHE_PREFIX = "dashboard_cache_"

interface DashboardCache {
  totalEleves: number
  upcomingCount: number
  pendingReports: number
  partitionsCount: number
  inviteLink: string
}

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    profId: null as string | null,

    // data
    totalEleves: null as number | null,
    upcomingCount: null as number | null,
    pendingReports: null as number | null,
    partitionsCount: null as number | null,
    inviteLink: "" as string,

    // loaders
    loading: false,
    loadingEleves: false,
    loadingPlanning: false,
    loadingReports: false,
    loadingPartitions: false,
    regenLoading: false,


    ready: false,
    lastFetch: 0
  }),

  actions: {
    // =========================
    // 💾 CACHE
    // =========================
    hydrateFromCache(profId: string): boolean {
      this.profId = profId
      const raw = localStorage.getItem(CACHE_PREFIX + profId)
      if (!raw) return false

      try {
        const parsed = JSON.parse(raw) as {
          ts: number
          data: DashboardCache
        }

        if (Date.now() - parsed.ts > TTL) return false

        this.totalEleves = parsed.data.totalEleves ?? 0
        this.upcomingCount = parsed.data.upcomingCount ?? 0
        this.pendingReports = parsed.data.pendingReports ?? 0
        this.partitionsCount = parsed.data.partitionsCount ?? 0
        this.inviteLink = parsed.data.inviteLink ?? ""

        this.ready = true
        this.lastFetch = parsed.ts
        return true
      } catch {
        return false
      }
    },

    persistCache(): void {
      if (!this.profId) return

      const data: DashboardCache = {
        totalEleves: this.totalEleves ?? 0,
        upcomingCount: this.upcomingCount ?? 0,
        pendingReports: this.pendingReports ?? 0,
        partitionsCount: this.partitionsCount ?? 0,
        inviteLink: this.inviteLink
      }

      localStorage.setItem(
        CACHE_PREFIX + this.profId,
        JSON.stringify({
          ts: Date.now(),
          data
        })
      )
    },

    // =========================
    // 🔄 REFRESH
    // =========================
    async refresh(profId: string): Promise<void> {
      if (this.loading) return

      this.loading = true
      this.profId = profId

      this.loadingEleves = true
      this.loadingPlanning = true
      this.loadingReports = true
      this.loadingPartitions = true

      try {
        const [
          eleves,
          planning,
          reports,
          uploads,
          invite
        ] = await Promise.all([
          apiFetch("getelevesbyprof", { prof_id: profId }),
          apiFetch("getplanningprof", { prof_id: profId }),
          apiFetch("getreportsprof", { prof_id: profId }),
          apiFetch("getuploadsbyprof", { prof_id: profId }),
          apiFetch("createInviteLink")
        ])

        this.totalEleves =
          eleves?.eleves?.filter((e: any) => e.statut === "inscrit").length ?? 0
        this.loadingEleves = false

        this.upcomingCount =
          planning?.planning?.filter((p: any) => p.status === "A_VENIR").length ?? 0
        this.loadingPlanning = false

        this.pendingReports =
          reports?.reports?.filter((r: any) => r.status === "DEMANDE").length ?? 0
        this.loadingReports = false

        const PARTITIONS_FOLDER_ID =
          "d3c54982-b7d7-4383-8472-b66d2f82f913"

        this.partitionsCount =
          uploads?.uploads?.filter(
            (u: any) =>
              u.file_type === "application/pdf" &&
              u.folder_id === PARTITIONS_FOLDER_ID
          ).length ?? 0
        this.loadingPartitions = false

        this.inviteLink = invite?.invite_link || ""

        this.ready = true
        this.persistCache()
      } catch (e) {
        console.error("❌ dashboard.refresh", e)
      } finally {
        this.loading = false
      }
    },

    // =========================
    // 🔁 INVITE
    // =========================
async regenInviteLink(): Promise<void> {
  if (!this.profId) return

  this.regenLoading = true
  try {
    const data = await apiFetch("createInviteLink")
    if (data?.invite_link) {
      this.inviteLink = data.invite_link
      this.persistCache()
    }
  } finally {
    this.regenLoading = false
  }
}

  }
})
