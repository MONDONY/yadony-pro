// app/features/cancellation/types/index.ts

/**
 * État du retour d'un colis annulé après remise.
 * `returnCode` n'est renseigné que côté expéditeur ; null pour le voyageur.
 */
export interface ReturnStatus {
  returnCode: string | null
  returnDeadline: string | null
  returnedAt: string | null
}
