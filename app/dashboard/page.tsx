import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import PortfolioView from "@/components/PortfolioView";
import { loadOwnerPortfolio } from "@/lib/portfolio";
import RefreshButton from "./RefreshButton";
import CopyButton from "./CopyButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.login) {
    redirect("/api/auth/signin");
  }

  const username = session.user.login;
  const { user, repos, portfolio } = await loadOwnerPortfolio(username);

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
            className="toolbar-btn focus-ring text-xs text-muted hover:text-fg active:text-fg transition-colors duration-200"
            style={{ transitionTimingFunction: "var(--ease-out)" }}
          >
            View public
          </Link>
          <CopyButton url={portfolioUrl} />
          <form
            className="inline-flex items-center m-0 p-0"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="toolbar-btn focus-ring text-xs text-muted hover:text-fg active:text-fg transition-colors duration-200"
              style={{ transitionTimingFunction: "var(--ease-out)" }}
            >
              Sign out
            </button>
          </form>
        </>
      }
      projectsAction={<RefreshButton username={username} />}
    />
  );
}
