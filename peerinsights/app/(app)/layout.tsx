// app/(app)/layout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { getCurrentUser, isLoggedIn } from "../lib/authClient";
import type { AuthUser } from "../lib/zodSchemas";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const authenticated = isLoggedIn();

    if (!authenticated) {
      router.replace("/login");
      return;
    }

    setUser(getCurrentUser());
    setCheckingAuth(false);
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff7f0]">
        <Spinner />
      </div>
    );
  }

  const professorName = user ? `${user.first_name} ${user.last_name}` : "Instructor";
  const professorEmail = user?.email ?? "instructor@example.com";
  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "IN";

  return (
    <main className="min-h-screen flex flex-col bg-[#fff7f0] font-figtree">
      {/* Shared Header */}
      <header className="w-full border-b border-orange-100 bg-white/70 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-primary/70">
              PeerInsights
            </p>
            <h1 className="text-lg font-semibold text-primary">Instructor Dashboard</h1>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex flex-col text-right">
              <span className="font-medium text-gray-900">Prof. {professorName}</span>
              <span className="text-gray-500 text-xs">{professorEmail}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1 flex items-start justify-center">
        <div className="max-w-5xl w-full px-6 py-10">{children}</div>
      </section>
    </main>
  );
}
