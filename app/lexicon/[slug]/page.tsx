import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { MoreTerms } from "@/components/lexicon/Head";
import { MarkdownEntry } from "@/components/lexicon/MarkdownEntry";
import { StructuredEntry } from "@/components/lexicon/StructuredEntry";
import { profile } from "@/lib/data";
import { allSlugs, getEntry, listLexicon } from "@/lib/lexicon-store";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;
export const generateStaticParams = async () => (await allSlugs()).map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await getEntry((await params).slug);
  if (!found) return { title: "Term not found" };
  const { slug } = found.entry;
  const [title, description] =
    found.kind === "structured"
      ? [`${found.entry.term} — ${found.entry.full} · DV Lexicon`, found.entry.summary]
      : [`${found.entry.title} · DV Lexicon`, found.entry.definition];
  return {
    title: `${title} — ${profile.name}`,
    description,
    alternates: { canonical: `/lexicon/${slug}` },
    openGraph: { title, description, type: "article" },
  };
}

export default async function LexiconEntryPage({ params }: { params: Params }) {
  const slug = (await params).slug;
  const [found, all] = await Promise.all([getEntry(slug), listLexicon()]);
  if (!found) notFound();
  const more = <MoreTerms entries={all.filter((e) => e.slug !== slug)} />;

  return (
    <>
      {found.kind === "structured" ? <StructuredEntry e={found.entry} more={more} /> : <MarkdownEntry e={found.entry} more={more} />}
      <ChatWidget />
    </>
  );
}
