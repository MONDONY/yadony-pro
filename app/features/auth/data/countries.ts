/**
 * Indicatifs proposés à la connexion par téléphone.
 *
 * Miroir de `dony_app/lib/core/phone/phone_country.dart` : un compte créé
 * depuis l'application mobile doit toujours pouvoir se connecter au portail.
 * La liste ne comptait que six pays, et une testeuse installée à Houston ne
 * pouvait pas saisir son numéro américain (FLUTTER-JD).
 *
 * `strip` indique si le zéro initial est un préfixe interurbain à retirer.
 * Ailleurs il fait partie du numéro : le retirer fabrique un destinataire qui
 * n'existe pas (Côte d'Ivoire depuis 2021, Bénin depuis 2020, Italie…).
 *
 * La Guinée n'est pas dans le catalogue de l'application, mais elle était
 * proposée par le portail : la retirer couperait la connexion des comptes
 * guinéens existants.
 */
export interface Country {
  /** Code ISO à deux lettres, identifiant réel : CA et US partagent `+1`. */
  code: string
  flag: string
  name: string
  dial: string
  /** Le zéro initial est-il un préfixe interurbain à retirer ? */
  strip: boolean
  /** Exemple de saisie affiché en filigrane. */
  hint: string
}

/** Pays principaux, en tête de liste (les quatre premiers servent de raccourcis). */
const MAIN: Country[] = [
  { code: 'FR', flag: '🇫🇷', name: 'France', dial: '+33', strip: true, hint: '06 12 34 56 78' },
  { code: 'SN', flag: '🇸🇳', name: 'Sénégal', dial: '+221', strip: false, hint: '77 123 45 67' },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire", dial: '+225', strip: false, hint: '07 48 84 08 74' },
  { code: 'ML', flag: '🇲🇱', name: 'Mali', dial: '+223', strip: false, hint: '76 12 34 56' },
  { code: 'CM', flag: '🇨🇲', name: 'Cameroun', dial: '+237', strip: false, hint: '6 71 23 45 67' },
  { code: 'GN', flag: '🇬🇳', name: 'Guinée', dial: '+224', strip: false, hint: '622 12 34 56' },
]

const OTHERS: Country[] = [
  // Europe — préfixe interurbain 0
  { code: 'DE', flag: '🇩🇪', name: 'Allemagne', dial: '+49', strip: true, hint: '0151 23456789' },
  { code: 'AT', flag: '🇦🇹', name: 'Autriche', dial: '+43', strip: true, hint: '0664 1234567' },
  { code: 'BE', flag: '🇧🇪', name: 'Belgique', dial: '+32', strip: true, hint: '0470 12 34 56' },
  { code: 'HR', flag: '🇭🇷', name: 'Croatie', dial: '+385', strip: true, hint: '091 234 5678' },
  { code: 'FI', flag: '🇫🇮', name: 'Finlande', dial: '+358', strip: true, hint: '040 1234567' },
  { code: 'IE', flag: '🇮🇪', name: 'Irlande', dial: '+353', strip: true, hint: '085 123 4567' },
  { code: 'NL', flag: '🇳🇱', name: 'Pays-Bas', dial: '+31', strip: true, hint: '06 12345678' },
  { code: 'GB', flag: '🇬🇧', name: 'Royaume-Uni', dial: '+44', strip: true, hint: '07911 123456' },
  { code: 'SK', flag: '🇸🇰', name: 'Slovaquie', dial: '+421', strip: true, hint: '0912 123 456' },
  { code: 'SI', flag: '🇸🇮', name: 'Slovénie', dial: '+386', strip: true, hint: '031 123 456' },
  { code: 'CH', flag: '🇨🇭', name: 'Suisse', dial: '+41', strip: true, hint: '078 123 45 67' },
  // Europe — sans préfixe interurbain (Lituanie : préfixe 8, pas 0)
  { code: 'IT', flag: '🇮🇹', name: 'Italie', dial: '+39', strip: false, hint: '312 345 6789' },
  { code: 'ES', flag: '🇪🇸', name: 'Espagne', dial: '+34', strip: false, hint: '612 34 56 78' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal', dial: '+351', strip: false, hint: '912 345 678' },
  { code: 'GR', flag: '🇬🇷', name: 'Grèce', dial: '+30', strip: false, hint: '691 234 5678' },
  { code: 'CY', flag: '🇨🇾', name: 'Chypre', dial: '+357', strip: false, hint: '96 123456' },
  { code: 'MT', flag: '🇲🇹', name: 'Malte', dial: '+356', strip: false, hint: '9696 1234' },
  { code: 'LU', flag: '🇱🇺', name: 'Luxembourg', dial: '+352', strip: false, hint: '621 123 456' },
  { code: 'EE', flag: '🇪🇪', name: 'Estonie', dial: '+372', strip: false, hint: '5123 4567' },
  { code: 'LV', flag: '🇱🇻', name: 'Lettonie', dial: '+371', strip: false, hint: '21 234 567' },
  { code: 'LT', flag: '🇱🇹', name: 'Lituanie', dial: '+370', strip: false, hint: '612 34567' },
  // Amérique du Nord — préfixe interurbain 1, jamais 0
  { code: 'CA', flag: '🇨🇦', name: 'Canada', dial: '+1', strip: false, hint: '514 555 0123' },
  { code: 'US', flag: '🇺🇸', name: 'États-Unis', dial: '+1', strip: false, hint: '201 555 0123' },
  // Afrique de l'Ouest (UEMOA) — aucun préfixe interurbain
  { code: 'BJ', flag: '🇧🇯', name: 'Bénin', dial: '+229', strip: false, hint: '01 96 12 34 56' },
  { code: 'BF', flag: '🇧🇫', name: 'Burkina Faso', dial: '+226', strip: false, hint: '70 12 34 56' },
  { code: 'NE', flag: '🇳🇪', name: 'Niger', dial: '+227', strip: false, hint: '90 12 34 56' },
  { code: 'TG', flag: '🇹🇬', name: 'Togo', dial: '+228', strip: false, hint: '90 12 34 56' },
  { code: 'GW', flag: '🇬🇼', name: 'Guinée-Bissau', dial: '+245', strip: false, hint: '955 012 345' },
  // Afrique centrale (CEMAC)
  { code: 'GA', flag: '🇬🇦', name: 'Gabon', dial: '+241', strip: false, hint: '06 03 12 34' },
  { code: 'CG', flag: '🇨🇬', name: 'Congo', dial: '+242', strip: false, hint: '06 123 45 67' },
  { code: 'TD', flag: '🇹🇩', name: 'Tchad', dial: '+235', strip: false, hint: '63 01 23 45' },
  { code: 'CF', flag: '🇨🇫', name: 'Centrafrique', dial: '+236', strip: false, hint: '70 01 23 45' },
  { code: 'GQ', flag: '🇬🇶', name: 'Guinée équatoriale', dial: '+240', strip: false, hint: '222 123 456' },
  // RD Congo : seule de la région avec un préfixe interurbain 0
  { code: 'CD', flag: '🇨🇩', name: 'RD Congo', dial: '+243', strip: true, hint: '081 234 5678' },
]

/** Pays principaux en tête, puis les autres par ordre alphabétique. */
export const COUNTRIES: Country[] = [
  ...MAIN,
  ...[...OTHERS].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
]

/** Pays par défaut du sélecteur : la France, départ le plus fréquent. */
export const DEFAULT_COUNTRY: Country = COUNTRIES[0]!

export function countryForCode(code: string): Country | undefined {
  const normalized = code.trim().toUpperCase()
  return COUNTRIES.find(c => c.code === normalized)
}
