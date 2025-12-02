// composables/useUserRole.js
export function computeUserRole(user) {
  if (!user || !user.statut) return "guest";

  const abonnement = user.type_abonnement?.toLowerCase() || "";

  if (user.paiement === "OK" && abonnement.includes("abo")) return "adherent";
  if (user.statut === "inscrit") return "user";

  return "guest";
}
