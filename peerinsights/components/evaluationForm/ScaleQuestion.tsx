// components/evaluationForm/ScaleQuestion.tsx
import React from "react";
import type { Question } from "@/app/lib/zodSchemas";
import CustomSlider from "./CustomSlider";
import AccordionRubric from "./AccordionRubric";
import { FormHelperText } from "@mui/material";

type TM = { user_id: string; first_name: string; last_name: string };
type Props = {
  currentUserId: string;
  question: Question;
  teammates: TM[];
  scaleRatings: Record<string, number>;
  scaleComments: Record<string, string>;
  onScaleChange: (qid: string, uid: string, value: number) => void;
  onScaleComment: (qid: string, uid: string, text: string) => void;
  showErrors: boolean;
};

function fullName(m: TM) {
  return `${m.first_name} ${m.last_name}`;
}

export default function ScaleQuestion({
  currentUserId,
  question,
  teammates,
  scaleRatings,
  scaleComments,
  onScaleChange,
  onScaleComment,
  showErrors,
}: Props) {
  // Only render if question_type is "scale"
  if (question.question_type !== "scale") return null;
  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-gray-800">
          {question.title}
        </h2>
        {"scale_labels" in question && (
          <AccordionRubric scaleLabels={question.scale_labels} />
        )}
      </div>
      {teammates.map((tm) => {
        const name = fullName(tm);
        const key = `${question.question_id}-${tm.user_id}`;
        return (
          <div key={tm.user_id} className="mb-6">
            <p className="font-medium text-gray-700 mb-2">
              {name} {currentUserId === tm.user_id ? "(self)" : ""}
            </p>
            {showErrors && !(key in scaleRatings) && (
              <FormHelperText style={{ color: "red" }}>
                Rating field is required
              </FormHelperText>
            )}
            <CustomSlider
              name={key}
              min={"scale_min" in question ? question.scale_min : 1}
              max={"scale_max" in question ? question.scale_max : 5}
              step={1}
              marks
              valueLabelDisplay="auto"
              value={
                scaleRatings[key] ??
                ("scale_min" in question ? question.scale_min : 1)
              } // <-- controlled
              onChange={(_, val) =>
                onScaleChange(question.question_id, tm.user_id, val as number)
              }
            />

            <div className="flex justify-between text-sm text-gray-500 mt-1 px-1 mb-3">
              {Array.from(
                {
                  length:
                    "scale_max" in question && "scale_min" in question
                      ? question.scale_max - question.scale_min + 1
                      : 5,
                },
                (_, i) => ("scale_min" in question ? question.scale_min : 1) + i
              ).map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>

            <textarea
              placeholder="Optional explanation…"
              value={scaleComments[key] ?? ""}
              rows={2}
              className="w-full bg-white/70 border border-subtle-maroon-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) =>
                onScaleComment(question.question_id, tm.user_id, e.target.value)
              }
            />
          </div>
        );
      })}
    </>
  );
}
