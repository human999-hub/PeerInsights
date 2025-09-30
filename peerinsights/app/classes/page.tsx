//app/classes/page.tsx
"use client";
import ClassesList from "@/components/classes/ClassesList";
import CreateClass from "@/components/classes/CreateClass";
import React from "react";

export default function Classes() {
const [showCreateClass, setShowCreateClass] = React.useState(false);
const instructorEmail = "instructor@example.com";
  return (
    <main className="font-figtree max-w-4xl mx-auto px-6 py-8 rounded shadow-md glass-card-maroon">
      <h1 className="text-3xl font-bold mb-6 text-primary text-center">
        Classes
      </h1>
    <section className="mb-8 flex flex-col items-center">
        <button className="button-primary mb-4" onClick={() => {setShowCreateClass(true)}}> Create Class</button>
        {showCreateClass && <CreateClass />}
    </section>
<section>
    <p className="text-lg font-semibold mb-4">Your list of Classes:</p>
    <ClassesList instructorEmail={instructorEmail}/>
</section>


    </main>
  );
}
