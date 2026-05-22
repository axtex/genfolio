import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PortfolioView from "@/components/PortfolioView";
import { fetchGitHubUser, getPortfolioRepos } from "@/lib/github";
import { generatePortfolio } from "@/lib/claude";

export const revalidate = 86400;

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  try {
    const user = await fetchGitHubUser(username);
    const repos = await getPortfolioRepos(username);
    const portfolio = await generatePortfolio(user, repos);
    const firstSentence = portfolio.bio.split(/\.[\s]|\.$/)[0] + ".";
    const title = `${user.name ?? user.login} — genfolio`;
    return {
      title,
      description: firstSentence,
      openGraph: {
        title,
        description: firstSentence,
        images: [{ url: user.avatar_url }],
      },
    };
  } catch {
    return { title: "genfolio" };
  }
}

export default async function UserPortfolioPage({ params }: Props) {
  const { username } = await params;

  try {
    const user = await fetchGitHubUser(username);
    const repos = await getPortfolioRepos(username);
    const portfolio = await generatePortfolio(user, repos);

    return (
      <PortfolioView
        username={username}
        user={user}
        repos={repos}
        portfolio={portfolio}
      />
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not found")) notFound();
    throw err;
  }
}
