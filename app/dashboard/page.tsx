import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import PortfolioView from "@/components/PortfolioView";
import { fetchGitHubUser, getPortfolioRepos } from "@/lib/github";
import { generatePortfolio } from "@/lib/claude";
import RefreshButton from "./RefreshButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.login) {
    redirect("/api/auth/signin");
  }

  const username = session.user.login;
  const user = await fetchGitHubUser(username);
  const repos = await getPortfolioRepos(username);
  const portfolio = await generatePortfolio(user, repos);

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
          <RefreshButton username={username} />
          <Link
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            View public
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
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Sign out
            </button>
          </form>
        </>
      }
    />
  );
}
