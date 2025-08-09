'use client';

import Instructions from "@/components/evaluationForm/Instructions";
import QuestionPage from "@/components/evaluationForm/QuestionPage";

export default function EvaluationFormPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-8 bg-white rounded shadow-md font-[Arial]">
      <h1 className="text-3xl font-bold mb-6 text-[#861f41] text-center">
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
