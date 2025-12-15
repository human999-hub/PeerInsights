"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isLoggedIn } from "../lib/authClient";
import Spinner from "@/components/Spinner";
import { AuthUser } from "../lib/zodSchemas";

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  // const professorName = "Prof. Jane Doe";
  // const professorEmail = "jane.doe@vt.edu";

  useEffect(() => {
    const authenticated = isLoggedIn();

    if (!authenticated) {
      router.replace("/login");
    } else {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  const professorName =
    user ? `${user.first_name} ${user.last_name}` : "Instructor";
  const professorEmail = user?.email ?? "instructor@example.com";

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "IN";
  return (
    // bg-gray-50
    <main className="min-h-screen flex flex-col bg-[#fff7f0] font-figtree">
      {/* <div className="max-w-xl text-center p-8 glass-card-orange">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Welcome to PeerInsights
        </h1>
        <p className="text-gray-700 text-lg mb-6">View/Create Classes:</p>
        <Link href="/classes" className="button-primary mb-4">
          Classes
        </Link>
        <p className="text-gray-700 text-lg mb-6">
          Click below to evaluate your team members:
        </p>
        <Link href="/evaluation" className="button-primary">
          Go to Evaluation Form
        </Link>
      </div> */}
      {/* Header */}
      <header className="w-full border-b border-orange-100 bg-white/70 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-primary/70">
              PeerInsights
            </p>
            <h1 className="text-lg font-semibold text-primary">
              Instructor Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex flex-col text-right">
              <span className="font-medium text-gray-900">Prof. {professorName}</span>
              <span className="text-gray-500 text-xs">{professorEmail}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
              {/* Initials; eventually compute from professorName */}
              {initials}
            </div>
          </div>
        </div>
      </header>
      {/* Content */}
      <section className="flex-1 flex items-start justify-center">
        <div className="max-w-5xl w-full px-6 py-10">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-primary mb-2">
              Welcome to PeerInsights
            </h2>
            {/* <p className="text-gray-700 text-sm md:text-base">
              Quickly jump into your classes or review peer evaluation
              responses.
            </p> */}
          </div>

          {/* Dashboard tiles */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Classes */}
            <Link
              href="/classes"
              className="group bg-white/90 rounded-2xl px-6 py-5 flex flex-col items-start border border-orange-100 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="mb-3 inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Classes
              </div>
              <h3 className="text-lg font-semibold text-primary mb-1">
                View & Manage Classes
              </h3>
              <p className="text-sm text-gray-700 mb-4 text-left">
                Create new classes, assignments and manage existing ones.
              </p>
              <span className="mt-auto text-sm font-medium text-primary group-hover:underline">
                Go to Classes →
              </span>
            </Link>

            {/* Responses */}
            <Link
              href="/responses"
              className="group bg-white/90 rounded-2xl px-6 py-5 flex flex-col items-start border border-orange-100 shadow-md hover:shadow-lg transition-shadow"
            >
             <div className="mb-3 inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Responses
              </div>
              <h3 className="text-lg font-semibold text-primary mb-1">
                View Responses & Insights
              </h3>
              {/* <p className="text-sm text-gray-700 mb-4 text-left">
                Browse peer evaluation responses by class and assignment, and
                export data for grading or analysis.
              </p> */}
              <span className="mt-auto text-sm font-medium text-primary group-hover:underline">
                Go to Responses →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
