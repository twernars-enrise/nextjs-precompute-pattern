import type { Dictionary } from "./nl-BE";

export const frBE: Dictionary = {
  home: {
    title: "Bienvenue chez Elektramat",
    intro: "Du matériel d’installation pour les professionnels, livré demain.",
  },
  groups: {
    label: "Choisissez votre affichage",
    names: {
      default: "Pas encore de choix",
      type_particulier: "Particulier",
      "type_e-installatie": "Installateur électricien",
      "type_w-installatie": "Installateur chauffagiste",
      type_bouw: "Bâtiment & construction",
      type_anders_zakelijk: "Autre professionnel",
    },
  },
  hero: {
    private: {
      title: "Vos travaux à la maison",
      text: "Tout pour votre projet, avec des prix clairs TVA comprise.",
    },
    business: {
      title: "Votre grossiste professionnel",
      text: "Des prix professionnels avantageux, paiement sur facture.",
    },
  },
  usps: {
    default: [
      "Commandé avant 22h00, livré demain",
      "Plus de 100 000 produits",
      "Retour gratuit",
    ],
    type_particulier: [
      "Commandé avant 22h00, livré demain",
      "Des conseils personnalisés pour votre projet",
      "Retour gratuit",
    ],
    "type_e-installatie": [
      "Commandé avant 22h00, livré demain sur chantier",
      "Gamme complète de matériel d’installation",
      "Paiement sur facture",
    ],
    "type_w-installatie": [
      "Commandé avant 22h00, livré demain sur chantier",
      "Tout pour le chauffage et le sanitaire",
      "Paiement sur facture",
    ],
    type_bouw: [
      "Livraison sur chantier",
      "Grandes quantités en stock",
      "Paiement sur facture",
    ],
    type_anders_zakelijk: [
      "Commandé avant 22h00, livré demain",
      "Prix professionnels",
      "Paiement sur facture",
    ],
  },
  vat: {
    examplePrice: "Prix d’exemple",
    incl: "TVAC",
    excl: "HTVA",
  },
  info: {
    title: "À propos d’Elektramat",
    text: "Une deuxième page statique pour tester la navigation dans le navigateur.",
    link: "En savoir plus sur Elektramat",
    back: "Retour à la page d’accueil",
  },
};
