# Synchronisation yadony-pro × dony-back (11/09 → 02/10/2026)

> Écart relevé entre le portail et les 89 commits de dony-back depuis le 11/09. Branche : `claude/gifted-gates-ssp1zk`.

## Fait

| Domaine | Endpoints / règles (dony-back) | Côté portail |
|---|---|---|
| Date d'arrivée | `arrivalDate` (#362), `arrivalDayOffset` des modèles et récurrences (#363) | Champ dans le formulaire de trajet, règles de `ArrivalRules` reprises dans `lib/dates.ts`, décalage recalé sur la date de départ |
| Offres | plafond de 500 € retiré (#315) | `maxNegotiationPrice` ne garde que le garde-fou technique (1 000 000) |
| Report de trajet | `POST /announcements/{id}/reschedule` (#364), `remainingReschedules` (#365) | Bouton + modale « Reporter », bilan des expéditeurs à prévenir, rappel « décision en attente » sur les colis |
| Audience | `GET /announcements/{id}/insights` (#367) | Bloc « Audience » de la vue générale du trajet |
| Résumé d'activité | `GET /travelers/me/trips-summary`, `/revenues`, `/kg-sold` (#297, #310) | Section en tête de « Mon activité » : chiffres clés, revenus par devise et par rail, kilos par trajet |
| Portefeuille | soldes par devise + total estimé (#310), recharge mobile money (#307), remboursement (#302, #309) | Liste des portefeuilles, formulaire mobile money avec relecture du statut, panneau de remboursement |
| Versement mobile money | `/payments/mobile-money/account`, `/providers` (#296, #303) | Carte « Versement par mobile money » dans Paramètres |
| Langue | `PATCH /users/me/preferences` (#323) | Carte « Langue des messages » (fr, en) |
| Destinataire | `GET /conversations/bid/{id}/recipient` (#374) | Bouton « Écrire » dans le détail d'un colis dont le destinataire suit le colis |
| Support | `/support/*` (#347, #349) | Pages `/support` et `/support/[id]` : FAQ, demandes, fil, non-lus |
| Suivi | `scanMethod` (#337) | Étapes déclarées depuis le portail envoyées avec `MANUAL` |
| Dette | `lat/lng` à 0, `rating: 0` | Adresses réelles à la création depuis une demande ; note expéditeur `null` plutôt qu'un faux 0,0 |

## Non repris

- **Appels audio** (`GET /calls/token`, `POST /conversations/{id}/calls`, #380) : demande le SDK Stream Video côté web.
- **Réceptions et invitations de destinataire** (`/receptions`, `/recipient-invitations`, `PUT /bids/{id}/recipient`) : parcours du destinataire et de l'expéditeur, pas du voyageur PRO.
- **Paiement mobile money d'un colis ou d'une négociation** (`/bids/{id}/mobile-money/*`) : côté expéditeur.
- **Page publique d'une demande** (`GET /public/demande/{id}`, #308) et **invitations de voyageurs** (`POST /package-requests/{id}/invitations`) : côté expéditeur.
- **Pièces jointes du support** (`POST /support/attachments`) : les messages sont en texte seul.

## À valider avec le back

- La note de l'expéditeur n'est pas servie sur `BidResponse` : le portail affiche le nombre d'envois seul.
- `recipientName` n'est servi au voyageur que sous conditions de confidentialité : le portail retombe sur « inscrit sur Yadony ».
