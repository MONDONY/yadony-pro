import { extractProblem } from '@/lib/apiError'

type AuthErrorContext = 'send-email-otp' | 'confirm-email-otp' | 'confirm-phone-otp'

const TECHNICAL_ERROR_PATTERN = /\[(GET|POST|PUT|PATCH|DELETE)\]|https?:\/\/|\/api\/|:\s?\d{3}\b/i

const CODE_MESSAGES: Record<string, string> = {
  'email-otp-invalid': 'Code incorrect ou expiré. Vérifie le code reçu par email ou demande un nouveau code.',
  'email-otp-expired': 'Code incorrect ou expiré. Vérifie le code reçu par email ou demande un nouveau code.',
  'invalid-otp': 'Code incorrect ou expiré. Vérifie le code reçu ou demande un nouveau code.',
  'otp-expired': 'Code incorrect ou expiré. Vérifie le code reçu ou demande un nouveau code.',
  'too-many-requests': 'Trop de tentatives. Attends quelques minutes avant de réessayer.',
  'rate-limited': 'Trop de tentatives. Attends quelques minutes avant de réessayer.',
}

const CONTEXT_FALLBACKS: Record<AuthErrorContext, string> = {
  'send-email-otp': "Impossible d'envoyer le code pour le moment. Réessaie dans quelques instants.",
  'confirm-email-otp': 'Code incorrect ou expiré. Vérifie le code reçu par email ou demande un nouveau code.',
  'confirm-phone-otp': 'Code incorrect ou expiré. Vérifie le code reçu par SMS ou demande un nouveau code.',
}

export function friendlyAuthError(error: unknown, context: AuthErrorContext): string {
  const problem = extractProblem(error)
  if (problem.code && CODE_MESSAGES[problem.code]) {
    return CODE_MESSAGES[problem.code]
  }

  const message = error instanceof Error ? error.message : ''
  const detail = problem.detail ?? message
  if (detail && !TECHNICAL_ERROR_PATTERN.test(detail)) {
    return detail
  }

  return CONTEXT_FALLBACKS[context]
}
