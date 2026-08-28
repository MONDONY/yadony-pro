// Extraction du corps ProblemDetail (RFC 7807) d'une erreur $fetch/ofetch.
// Le backend renvoie { type, title, status, detail, code } — on ne lit que code + detail.

// Détecte un message brut de bas niveau (verbe HTTP, URL, code de statut) pour
// ne jamais l'afficher tel quel à l'utilisateur. Partagé par tous les filtres
// d'erreur du portail (friendlyAuthError, useSubscription…) : un ajustement
// futur de cette détection ne doit pas pouvoir faire diverger les filtres.
export const TECHNICAL_ERROR_PATTERN = /\[(GET|POST|PUT|PATCH|DELETE)\]|https?:\/\/|\/api\/|:\s?\d{3}\b/i

export interface ProblemInfo {
  code: string | null
  detail: string | null
}

export function extractProblem(e: unknown): ProblemInfo {
  const data = (e as { data?: unknown } | null | undefined)?.data
  if (typeof data !== 'object' || data === null) return { code: null, detail: null }
  const { code, detail } = data as { code?: unknown; detail?: unknown }
  return {
    code: typeof code === 'string' ? code : null,
    detail: typeof detail === 'string' ? detail : null,
  }
}
