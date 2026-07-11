// Extraction du corps ProblemDetail (RFC 7807) d'une erreur $fetch/ofetch.
// Le backend renvoie { type, title, status, detail, code } — on ne lit que code + detail.
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
