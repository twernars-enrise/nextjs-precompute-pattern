import type { Metadata } from "next";
import { locales, resolveLocale } from "@/i18n";
import "../globals.css";

export const metadata: Metadata = {
  title: "Static variants: precompute pattern",
  description: "Prototype: precompute pattern",
};

export const generateStaticParams = () => locales.map((locale) => ({ locale }));

// Fail the build when the shell of a route cannot be prerendered.
export const ensureStatic = "shell";

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = resolveLocale((await params).locale);

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
