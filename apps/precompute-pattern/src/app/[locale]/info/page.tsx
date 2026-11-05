import Link from "next/link";
import { getDictionary, resolveLocale } from "@/i18n";
import { GroupSwitcher } from "../group-switcher";

// A second static page, to test client-side navigation back to the rewritten home page.
export default async function Info({ params }: PageProps<"/[locale]/info">) {
  const locale = resolveLocale((await params).locale);
  const dictionary = getDictionary(locale);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{dictionary.info.title}</h1>
        <GroupSwitcher groups={dictionary.groups} />
      </header>
      <p>{dictionary.info.text}</p>
      <Link href={`/${locale}`} className="underline">
        {dictionary.info.back}
      </Link>
    </main>
  );
}
