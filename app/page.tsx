import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="px-8 pt-8 shrink-0">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted select-none">
          genfolio
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full flex flex-col items-center text-center gap-10">
          <h1 className="font-display font-semibold text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight text-fg">
            Sign in.
            <br />
            Stand out.
            <span
              className="inline-block w-[3px] h-[0.8em] bg-fg/50 align-middle ml-2 cursor-blink"
              aria-hidden="true"
            />
          </h1>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-fg text-bg text-sm font-medium tracking-wide rounded hover:bg-fg/90 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-current shrink-0"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
              </svg>
              Continue with GitHub
            </button>
          </form>
        </div>
      </main>

      <section className="border-t border-border shrink-0">
        <div className="max-w-3xl mx-auto px-8 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { n: "01", text: "Sign in with GitHub." },
            { n: "02", text: "Get an AI-written bio and project descriptions." },
            { n: "03", text: "Share your portfolio." },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-start gap-3">
              <span className="font-mono text-sm text-muted/50 tabular-nums shrink-0">
                {n}
              </span>
              <span className="text-sm text-muted">{text}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border shrink-0">
        <div className="px-8 py-5 flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted/50 select-none">
            genfolio
          </span>
          <span className="font-mono text-[11px] text-muted/40">2026</span>
        </div>
      </footer>
    </div>
  );
}
