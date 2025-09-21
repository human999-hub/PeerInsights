// components/evaluationForm/TextQuestion.tsx
import React from "react";
import type { Question } from "@/app/lib/zodSchemas";

type TM = { user_id: string; first_name: string; last_name: string };
type Props = {
  question: Question;
  teammates: TM[];
  onTextChange: (qid: string, uid: string, text: string) => void;
};

function fullName(m: TM) {
  return `${m.first_name} ${m.last_name}`;
}

export default function TextQuestion({
  question,
  teammates,
  onTextChange,
}: Props) {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        {question.title}
      </h2>
      {teammates.map((tm) => {
        return (
          <div key={tm.user_id} className="mb-6">
            <label className="block text-gray-700 mb-1">{fullName(tm)}</label>
            <textarea
              placeholder="Explain your ratings / any issues…"
              rows={3}
              className="w-full bg-white/70 border border-subtle-maroon-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) =>
                onTextChange(question.question_id, tm.user_id, e.target.value)
              }
            />
          </div>
        );
      })}
    </>
  );
}