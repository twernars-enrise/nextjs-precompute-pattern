import Link from "next/link";
import { getDictionary, resolveLocale } from "@/i18n";
import { isPrivate, resolveSegment, segments, vatDisplay } from "@/segment";
import { GroupSwitcher } from "../group-switcher";

// One static page per locale and target group. proxy.ts rewrites /<locale> to one of these.
export const generateStaticParams = () => segments.map((segment) => ({ segment }));

// Stricter than the layout: fail the build if this page needs anything at request time.
export const ensureStatic = "navigation";

const examplePrice = 100;
const vatRate = 0.21;

export default async function Home({ params }: PageProps<"/[locale]/[segment]">) {
  const { locale: localeParam, segment: segmentParam } = await params;
  const locale = resolveLocale(localeParam);
  const segment = resolveSegment(segmentParam);
  const dictionary = getDictionary(locale);
  const hero = isPrivate(segment) ? dictionary.hero.private : dictionary.hero.business;
  const vat = vatDisplay(segment);
  const price = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(
    vat === "incl" ? examplePrice * (1 + vatRate) : examplePrice,
  );

  return (
    <main data-segment={segment} className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{dictionary.home.title}</h1>
        <GroupSwitcher current={segment} groups={dictionary.groups} />
      </header>

      <ul className="flex flex-wrap gap-4 bg-zinc-100 p-3 text-sm">
        {dictionary.usps[segment].map((usp) => (
          <li key={usp}>✓ {usp}</li>
        ))}
      </ul>

      <section className="rounded bg-zinc-900 p-8 text-white">
        <h2 className="text-xl font-semibold">{hero.title}</h2>
        <p>{hero.text}</p>
      </section>

      <p>{dictionary.home.intro}</p>

      <dl className="text-sm">
        <dt className="font-semibold">{dictionary.groups.label}</dt>
        <dd>{dictionary.groups.names[segment]}</dd>
        <dt className="font-semibold">{dictionary.vat.examplePrice}</dt>
        <dd>
          {price} {dictionary.vat[vat]}
        </dd>
      </dl>

      <Link href={`/${locale}/info`} className="underline">
        {dictionary.info.link}
      </Link>
    </main>
  );
}
