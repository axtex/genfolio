import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import PortfolioView from "@/components/PortfolioView";
import PortfolioNotGenerated from "@/components/PortfolioNotGenerated";
import { loadPublicPortfolio } from "@/lib/portfolio";

export const revalidate = 86400;

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  try {
    const result = await loadPublicPortfolio(username);
    if (result.status === "not_found") {
      return { title: "genfolio" };
    }
    const displayName = result.user.name ?? result.user.login;
    const title = `${displayName} — genfolio`;
    if (result.status === "not_generated") {
      return {
        title,
        description: `@${result.user.login} has not generated a genfolio yet.`,
        openGraph: {
          title,
          images: [{ url: result.user.avatar_url }],
        },
      };
    }
    const firstSentence = result.portfolio.bio.split(/\.[\s]|\.$/)[0] + ".";
    return {
      title,
      description: firstSentence,
      openGraph: {
        title,
        description: firstSentence,
        images: [{ url: result.user.avatar_url }],
      },
    };
  } catch {
    return { title: "genfolio" };
  }
}

export default async function UserPortfolioPage({ params }: Props) {
  const { username } = await params;
  const result = await loadPublicPortfolio(username);

  if (result.status === "not_found") notFound();

  if (result.status === "not_generated") {
    // Do not ISR an empty page — after the owner generates, the next
    // public request should see the cached Claude result.
    noStore();
    return <PortfolioNotGenerated user={result.user} />;
  }

  return (
    <PortfolioView
      username={username}
      user={result.user}
      repos={result.repos}
      portfolio={result.portfolio}
    />
  );
}
