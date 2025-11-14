//app/classes/page.tsx
"use client";
import ClassesList from "@/components/classes/ClassesList";
import CreateClass from "@/components/classes/CreateClass";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { isLoggedIn } from "../lib/authClient";
import Spinner from "@/components/Spinner";

export default function Classes() {
     const router = useRouter();
    const [checkingAuth, setCheckingAuth] = useState(true);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const instructorEmail = "instructor@example.com";
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
    <main className="font-figtree max-w-4xl mx-auto px-6 py-8 rounded shadow-md glass-card-maroon">
     <div className="flex items-center gap-3 mt-6">
        <Link className="button-secondary" href="/">
          Back
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6 text-primary text-center">
        Classes
      </h1>
      <section className="mb-8 flex flex-col items-center">
        <button
          className="button-primary mb-4"
          onClick={() => {
            setShowCreateClass(true);
          }}
        >
          Create Class
        </button>
        {showCreateClass && <CreateClass />}
      </section>
      <section>
        <p className="text-lg font-semibold mb-4">Your list of Classes:</p>
        <ClassesList instructorEmail={instructorEmail} />
      </section>
    </main>
  );
}
