import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import PortfolioView from "@/components/PortfolioView";
import { fetchGitHubUser, getPortfolioRepos } from "@/lib/github";
import { generatePortfolio } from "@/lib/claude";
import RefreshButton from "./RefreshButton";
import CopyButton from "./CopyButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.login) {
    redirect("/api/auth/signin");
  }

  const username = session.user.login;
  const user = await fetchGitHubUser(username);
  const repos = await getPortfolioRepos(username);
  const portfolio = await generatePortfolio(user, repos);

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const portfolioUrl = `${baseUrl}/${username}`;

  return (
    <PortfolioView
      username={username}
      user={user}
      repos={repos}
      portfolio={portfolio}
      showFooter={false}
      devRaw={process.env.NODE_ENV === "development" ? portfolio : undefined}
      toolbar={
        <>
          <Link
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted hover:text-fg transition-colors"
          >
            View public →
          </Link>
          <form
            className="inline-flex items-center m-0"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-muted hover:text-fg transition-colors"
            >
              Sign out
            </button>
          </form>
        </>
      }
      banner={
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] text-muted/60 uppercase tracking-wider font-medium">
            Live at
          </span>
          <code className="font-mono text-xs text-fg/70">{portfolioUrl}</code>
          <CopyButton url={portfolioUrl} />
        </div>
      }
      projectsAction={<RefreshButton username={username} />}
    />
  );
}
