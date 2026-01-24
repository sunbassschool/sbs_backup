import { jwtDecode } from "jwt-decode"

export function buildUserFromJwt(jwt) {
  const p = jwtDecode(jwt)
  return {
    email: p.email || "",
    prenom: p.prenom || "",
    nom: p.prenom || "",
    role: p.role || null,
    abo: p.abo || "",
    user_id: p.user_id || null,
    prof_id: p.prof_id || null,
    avatar_url: p.avatar_url || "",
    statut: p.statut || "",
    privileges: [],
    success: true
  }
}
