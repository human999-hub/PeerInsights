// app/evaluation/page.tsx
'use client';

import Instructions from "@/components/evaluationForm/Instructions";
import QuestionPage from "@/components/evaluationForm/QuestionPage";

export default function EvaluationFormPage() {
  return (
    <main className="font-figtree max-w-4xl mx-auto px-6 py-8 rounded shadow-md glass-card-maroon">
      <h1 className="font-figtree text-3xl font-bold mb-6 text-primary text-center">
        Team Member Evaluation
      </h1>

      <section className="mb-8">
        <Instructions />
      </section>

      {/* Renders paginated question-by-question form */}
      <QuestionPage />
    </main>
  );
}
