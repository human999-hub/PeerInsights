// app/classes/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ClassesList from "@/components/classes/ClassesList";
import CreateClass from "@/components/classes/CreateClass";
import Spinner from "@/components/Spinner";
import { isLoggedIn } from "../../lib/authClient";
import { getCurrentUser } from "@/app/lib/authClient";
export default function Classes() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<"view" | "create">("view");

  const user = getCurrentUser();

  if (!user?.email) {
    throw new Error("Instructor email not found in session");
  }

  const instructorEmail = user.email;

  useEffect(() => {
    const authenticated = isLoggedIn();

    if (!authenticated) {
      router.replace("/login");
    } else {
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

  return (
    <main className="min-h-screen bg-[#fff7f0] font-figtree">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Top row: back + title */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link
            href="/"
            className="button-secondary text-sm inline-flex items-center gap-2"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>

          <h1 className="flex-1 text-center text-2xl md:text-3xl font-semibold text-primary">
            Classes
          </h1>

          {/* spacer to balance layout on desktop */}
          <div className="w-[120px] hidden md:block" />
        </div>

        {/* <p className="text-sm text-gray-700 mb-6">
          Manage your course sections and connect them to peer-evaluation
          assignments.
        </p> */}

        {/* Tabs */}
        <div className="mb-6 justify-center border-b border-orange-200 flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("view")}
            className={`pb-2 text-sm md:text-base font-medium transition-colors cursor-pointer ${
              activeTab === "view"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-primary/80"
            }`}
          >
            View Classes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`pb-2 text-sm md:text-base font-medium transition-colors cursor-pointer ${
              activeTab === "create"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-primary/80"
            }`}
          >
            Create Class
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "view" && (
          <section className="bg-white/90 rounded-2xl px-6 py-5 border border-orange-100 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">
                Your list of classes
              </h2>
              {/* placeholder for future filters/search */}
              {/* <button className="text-xs text-primary/80 underline">
                Filter
              </button> */}
            </div>
            <ClassesList instructorEmail={instructorEmail} />
          </section>
        )}

        {activeTab === "create" && (
          <section className="bg-white/90 rounded-2xl px-6 py-5 flex flex-col items-start border border-orange-100 shadow-md">
            {/* <h2 className="text-lg font-semibold text-primary mb-3">
              Create a new class
            </h2> */}
            {/* <p className="text-sm text-gray-700 mb-4">
              Set up a new course section to attach evaluation forms and track
              responses.
            </p> */}
            <CreateClass />
          </section>
        )}
      </div>
    </main>
  );
}
