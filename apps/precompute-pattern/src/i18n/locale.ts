import { notFound } from "next/navigation";

export const locales = ["nl-BE", "fr-BE"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "nl-BE";

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const resolveLocale = (value: string): Locale => {
  if (!isLocale(value)) {
    notFound();
  }

  return value;
};
