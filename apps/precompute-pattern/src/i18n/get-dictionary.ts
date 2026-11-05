import { frBE } from "./dictionaries/fr-BE";
import { type Dictionary, nlBE } from "./dictionaries/nl-BE";
import type { Locale } from "./locale";

const dictionaries: Record<Locale, Dictionary> = {
  "nl-BE": nlBE,
  "fr-BE": frBE,
};

export const getDictionary = (locale: Locale) => dictionaries[locale];
