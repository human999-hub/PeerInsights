// app/(app)/page.tsx
"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <>
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-primary mb-2">
          Welcome to PeerInsights
        </h2>
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
          <span className="mt-auto text-sm font-medium text-primary group-hover:underline">
            Go to Responses →
          </span>
        </Link>
      </div>
    </>
  );
}
