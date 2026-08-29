# Programmation complète des trajets récurrents

## Contexte

Dony Pro permet déjà de créer une récurrence à partir d'un modèle de trajet, de choisir des jours de semaine et de laisser le backend générer les annonces dans une fenêtre glissante fixe de 14 jours. Ce parcours ne permet pas de définir une période, un intervalle de plusieurs semaines, un délai de publication, ni de modifier une programmation. Le backend avance également un pointeur `lastGeneratedDate` même lorsqu'une publication échoue, ce qui empêche toute nouvelle tentative.

Cette évolution transforme l'option **Trajets récurrents** en programmateur complet, tout en préservant les clients existants et les programmations déjà enregistrées.

## Objectifs

- Configurer un trajet récurrent directement dans Dony Pro, sans modèle préalable obligatoire.
- Utiliser un modèle existant comme raccourci de préremplissage.
- Choisir les jours de départ et une fréquence de 1 à 4 semaines.
- Définir une date de début obligatoire et une date de fin optionnelle, sans durée maximale.
- Publier progressivement chaque annonce 7, 14, 21 ou 30 jours avant son départ, avec 14 jours par défaut.
- Calculer la date limite de dépôt le jour du départ ou 1, 2 ou 3 jours avant, avec 1 jour par défaut.
- Afficher les cinq prochaines dates de départ et de publication avant l'activation.
- Modifier, mettre en pause, reprendre et supprimer une programmation.
- Garantir l'idempotence des publications et retenter les échecs temporaires.
- Conserver la compatibilité de l'application Flutter et des programmations historiques.

## Non-objectifs

- Modifier l'interface Flutter dans ce chantier.
- Prendre en charge des expressions calendaires libres, des fréquences mensuelles ou des exceptions date par date.
- Modifier rétroactivement ou supprimer automatiquement les annonces déjà publiées quand une programmation change.
- Créer toutes les annonces de la période au moment de l'activation.

## Parcours Dony Pro

La page `/recurrences` remplace la création minimale actuelle par une gestion complète des programmations.

### Liste

Chaque ligne ou carte affiche :

- le corridor, le mode de transport et le prix ;
- les jours sélectionnés et la fréquence ;
- la période, avec « Sans date de fin » si nécessaire ;
- le délai de publication ;
- la prochaine date de départ et sa date de publication ;
- un statut dérivé : **À venir**, **Active**, **En pause**, **Terminée** ou **Action requise** ;
- les commandes **Modifier**, **Mettre en pause/Reprendre** et **Supprimer**.

Le statut est calculé ainsi :

- `TERMINATED` si `endDate` est antérieure à la date courante ;
- `PAUSED` si `active` vaut `false` et que la programmation n'est pas terminée ;
- `ACTION_REQUIRED` si la dernière tentative de publication a échoué et attend une action utilisateur ;
- `UPCOMING` si la première publication calculée est future ;
- `ACTIVE` dans les autres cas.

### Création et modification

Le formulaire permet d'abord de sélectionner facultativement un modèle. Il réutilise ensuite les champs et composants de création d'annonce pour configurer :

- villes, adresses et horaires ;
- transport, capacité et poids ;
- tarification au kilo ou mixte, prix, devise et négociation ;
- contenus acceptés et refusés ;
- paiement en espèces ;
- note aux expéditeurs.

La section **Programmation** contient :

- sept boutons de jours, du lundi au dimanche ;
- un contrôle de fréquence : 1, 2, 3 ou 4 semaines ;
- une date de début obligatoire ;
- une date de fin optionnelle, qui ne peut pas précéder le début ;
- un délai de publication : 7, 14, 21 ou 30 jours ;
- un délai limite de dépôt : 0, 1, 2 ou 3 jours avant le départ ;
- un aperçu des cinq prochaines occurrences avec, pour chacune, la date de publication et la date de départ.

La modification recharge le même formulaire. Elle ne modifie aucune annonce existante et ne s'applique qu'aux occurrences qui n'ont pas encore été générées.

Les suppressions utilisent une confirmation. Les erreurs API sont traduites en messages métier courts ; aucune URL, méthode HTTP, pile technique ou code brut n'est affiché.

## Règles calendaires

`startDate` et `endDate` bornent les **dates de départ**, pas les dates de publication.

La semaine d'ancrage est la semaine ISO, du lundi au dimanche, qui contient `startDate`. Une date candidate est retenue si :

1. elle est supérieure ou égale à `startDate` ;
2. elle est inférieure ou égale à `endDate` lorsque cette borne existe ;
3. son jour est sélectionné dans `weekdays` ;
4. le nombre de semaines ISO depuis la semaine d'ancrage est divisible par `weekInterval`.

La date de publication prévue vaut :

`departureDate - publicationLeadDays`

La date limite de dépôt vaut l'instant de départ moins `handoverLeadDays`. Lorsqu'aucune heure de départ n'est renseignée, le calcul utilise midi, comme le moteur actuel. Les calculs métier restent fondés sur la date locale du trajet ; l'exécution quotidienne du scheduler conserve son horaire UTC existant.

L'aperçu frontend et le moteur backend utilisent les mêmes cas de test calendaires afin d'éviter une divergence visible.

## Contrat API

Les requêtes et réponses `/trip-recurrences` ajoutent :

- `startDate: LocalDate` ;
- `endDate: LocalDate | null` ;
- `weekInterval: int` entre 1 et 4 ;
- `publicationLeadDays: int` parmi 7, 14, 21 et 30 ;
- `handoverLeadDays: int` entre 0 et 3 ;
- les champs déjà utilisés par Dony Pro mais non persistés par le moteur actuel : `pricingMode`, `negotiable`, `currency`, `refusedCategories` et `description` ;
- `lastPublicationErrorCode`, `lastPublicationErrorMessage` et `lastPublicationErrorAt` pour la dernière erreur sûre à afficher ;
- `status`, `nextDepartureDate` et `nextPublicationDate`, calculés par le backend pour la liste.

`horizonDays` reste accepté et renvoyé pendant la période de compatibilité. Pour une requête ancienne :

- `startDate` prend la date courante ;
- `endDate` reste nulle ;
- `weekInterval` vaut 1 ;
- `publicationLeadDays` prend exactement `horizonDays` lorsque sa valeur historique est comprise entre 1 et 60, et 14 par défaut ;
- `handoverLeadDays` vaut 0 afin de préserver le comportement historique.

Le nouveau champ `publicationLeadDays` n'accepte que 7, 14, 21 ou 30 pour les clients à jour. Le fallback `horizonDays` reste accepté entre 1 et 60 pour les anciens clients. Les autres nouveaux champs sont optionnels au niveau du DTO d'entrée pour ne pas casser l'application Flutter. Le backend renvoie toujours leurs valeurs normalisées.

## Persistance et migration

Une migration Flyway ajoute les nouveaux champs à `trip_recurrences` avec des valeurs compatibles pour les lignes existantes.

Les annonces générées reçoivent :

- `source_recurrence_id`, nullable et référencé vers `trip_recurrences` ;
- une contrainte unique partielle sur `(source_recurrence_id, departure_date)` lorsque `source_recurrence_id` n'est pas nul.

Cette contrainte constitue la garantie finale contre les doublons, y compris en cas d'exécutions concurrentes. Le service vérifie aussi l'existence avant la création pour éviter d'utiliser une exception comme chemin normal.

Les annonces déjà générées avant la migration n'ont pas de lien vers leur récurrence. Pour les programmations historiques, `lastGeneratedDate` est conservée comme borne de migration : aucune occurrence antérieure ou égale à cette date n'est recréée. Les nouvelles annonces utilisent ensuite le lien et la contrainte unique ; `lastGeneratedDate` n'est plus la seule garantie d'idempotence.

## Moteur de publication

Le scheduler quotidien parcourt uniquement les programmations actives non terminées. Pour chacune, il examine les dates de départ comprises entre aujourd'hui et `aujourd'hui + publicationLeadDays`, puis applique les règles calendaires.

Une occurrence est publiée si sa date de publication prévue est passée ou égale à aujourd'hui, si son départ n'est pas passé et si aucune annonce liée n'existe encore. Cette fenêtre permet :

- une publication progressive ;
- un rattrapage après une indisponibilité du scheduler ;
- une nouvelle tentative après un échec ;
- un coût borné à 31 dates par programmation et par exécution.

La création immédiate d'une programmation active exécute le même moteur afin de publier les occurrences déjà dues sans attendre le prochain passage de nuit.

La création d'annonce reprend intégralement les paramètres de la programmation. En mode `MIXED`, la grille tarifaire du voyageur est capturée au moment de la publication par le mécanisme de snapshot existant. Les futures annonces utilisent donc la grille en vigueur au jour de leur publication ; une annonce déjà créée conserve son snapshot.

Une violation de la contrainte unique est traitée comme une occurrence déjà publiée. Les autres échecs n'avancent pas définitivement un pointeur qui empêcherait la reprise.

## Erreurs et reprise

La programmation conserve la dernière erreur de publication sous une forme exploitable par Dony Pro. Les erreurs nécessitant une action utilisateur, par exemple KYC incomplet, profil professionnel suspendu ou configuration Stripe invalide, produisent le statut **Action requise** et un message métier.

Une publication réussie efface l'erreur précédente. Les échecs temporaires sont retentés chaque jour jusqu'au départ. Le traitement d'une occurrence reste isolé : une erreur sur une date ne bloque pas les autres programmations ni les autres dates.

Les journaux techniques et l'audit conservent l'identifiant de programmation, la date de départ et la cause interne sans les exposer dans l'interface.

## Structure frontend

La logique est séparée en trois responsabilités :

- un calculateur pur d'occurrences, utilisé par l'aperçu et couvert par des tests unitaires ;
- un formulaire de programmation qui orchestre les composants existants de trajet et valide les règles calendaires ;
- un gestionnaire de liste qui charge, filtre et déclenche les commandes de cycle de vie.

Le service `tripRecurrenceService` mappe les nouveaux champs et reste l'unique couche HTTP. Le formulaire de création d'annonce et celui de récurrence partagent les composants de champs existants ; les règles de soumission propres à chaque parcours restent dans leurs composables respectifs.

## Tests

### Backend

- calcul des jours pour chaque intervalle de 1 à 4 semaines ;
- bornes de début et de fin, fin optionnelle et changement d'année ;
- publication aux délais 7, 14, 21 et 30 jours ;
- calcul de la date limite de dépôt de 0 à 3 jours ;
- génération immédiate à la création et rattrapage après indisponibilité ;
- nouvelle tentative après échec ;
- absence de doublons en exécution répétée et concurrente ;
- édition non rétroactive ;
- fin automatique et exclusion des programmations en pause ;
- persistance de la tarification, négociation, devise et contenus refusés ;
- compatibilité des requêtes historiques avec `horizonDays` ;
- migration Flyway et contrainte unique ;
- tests d'intégration des opérations GET, POST, PUT et DELETE.

### Dony Pro

- calculateur des cinq prochaines occurrences ;
- validation des jours, fréquences et bornes de période ;
- création directe et préremplissage depuis un modèle ;
- édition, pause, reprise et suppression ;
- statuts et messages d'erreur métier ;
- mapping complet du service API ;
- test Playwright du parcours principal ;
- contrôle visuel sans chevauchement sur une largeur mobile et une largeur desktop.

## Déploiement et retour arrière

Le backend est déployé avant Dony Pro. La migration est additive : les nouvelles colonnes sont compatibles avec les clients historiques et les annonces non récurrentes gardent `source_recurrence_id = null`.

En cas de retour arrière du frontend, l'ancien Dony Pro et Flutter continuent d'envoyer `horizonDays`. En cas de retour arrière applicatif du backend après migration, les colonnes supplémentaires restent inutilisées mais ne bloquent pas l'ancienne version. La contrainte unique n'affecte que les annonces portant une récurrence source.

Le déploiement est considéré terminé lorsque les tests backend et frontend passent, que le scheduler peut créer une occurrence due sans doublon et que le parcours Dony Pro est validé sur desktop et mobile.
