"use client";

import React, { useMemo, useState } from "react";
import CustomSlider from "./CustomSlider";
import ProgressBar from "./ProgressBar";
import AccordionRubric from "./AccordionRubric";
import { groupOptions } from "./student";

import { useFormMetaQuery, useSubmitEvaluation } from "@/app/lib/queries";
import {
  FormRequestSchema,
  SubmissionPayloadSchema,
  type Question,
} from "@/app/lib/zodSchemas";

type TM = { user_id: string; first_name: string; last_name: string };

function fullName(m: TM) {
  return `${m.first_name} ${m.last_name}`;
}
function tpl(str: string | undefined, name: string) {
  return (str ?? "Anything to praise about {{name}}?").replace(/\{\{\s*name\s*\}\}/g, name);
}

export default function QuestionPage() {
  const [currentPage, setCurrentPage] = useState(0); // 0 = student info
  const isFirstPage = currentPage === 0;

  // student info (plus email+group to fetch meta)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [groupId, setGroupId] = useState<number | "">("");

  // trigger fetch when email+group are present
  const request = useMemo(() => {
    if (!email || !groupId) return null;
    return FormRequestSchema.parse({
      student_email: email.trim(),
      team_number: `Group_${groupId}`,
    });
  }, [email, groupId]);

  const { data, isFetching, isError, error } = useFormMetaQuery(request);
  const submit = useSubmitEvaluation();

  const questions = data?.questions ?? [];
  const teammates = (data?.team.members ?? []) as TM[];
  const totalPages = 1 + questions.length; // student info + questions
  const currentQuestion: Question | null =
    !isFirstPage && questions.length > 0 ? questions[currentPage - 1] : null;

  /** answers (keyed by `${qid}-${uid}`) */
  const [scaleRatings, setScaleRatings] = useState<Record<string, number>>({});
  const [scaleComments, setScaleComments] = useState<Record<string, string>>({});
  const [textPerTeammate, setTextPerTeammate] = useState<Record<string, string>>({});
  const [praiseTexts, setPraiseTexts] = useState<Record<string, string>>({});

  const onScaleChange = (qid: string, uid: string, value: number) =>
    setScaleRatings((p) => ({ ...p, [`${qid}-${uid}`]: value }));
  const onScaleComment = (qid: string, uid: string, text: string) =>
    setScaleComments((p) => ({ ...p, [`${qid}-${uid}`]: text }));
  const onTextChange = (qid: string, uid: string, text: string) =>
    setTextPerTeammate((p) => ({ ...p, [`${qid}-${uid}`]: text }));
  const onPraiseChange = (qid: string, uid: string, text: string) =>
    setPraiseTexts((p) => ({ ...p, [`${qid}-${uid}`]: text }));

  const handleNext = () => {
    if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
  };
  const handlePrevious = () => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  const handleSubmit = async () => {
    if (!data) return;

    // R A T I N G S
    const ratings = Object.entries(scaleRatings).map(([k, rating]) => {
      const [question_id, to_student_id] = k.split("-");
      return { question_id, to_student_id, rating: Math.round(Number(rating)) };
    });

    // C O M M E N T S  (both: "explain" text question + optional comments under scale)
    const comments: { question_id: string; to_student_id: string; comment_text: string }[] = [];
    for (const [k, text] of Object.entries(textPerTeammate)) {
      if ((text ?? "").trim()) {
        const [question_id, to_student_id] = k.split("-");
        comments.push({ question_id, to_student_id, comment_text: text });
      }
    }
    for (const [k, text] of Object.entries(scaleComments)) {
      if ((text ?? "").trim()) {
        const [question_id, to_student_id] = k.split("-");
        comments.push({ question_id, to_student_id, comment_text: text });
      }
    }

    // P R A I S E S
    const praises = Object.entries(praiseTexts)
      .filter(([, t]) => (t ?? "").trim().length > 0)
      .map(([k, praise_text]) => {
        const [question_id, to_student_id] = k.split("-");
        return { question_id, to_student_id, praise_text };
      });

    const payload = {
      assignment_id: data.assignment.assignment_id,
      team_id: data.team.team_id,
      from_student_id: data.student.user_id, // ← backend expects this name
      ratings,
      comments,
      praises,
    };

    const valid = SubmissionPayloadSchema.parse(payload);
    await submit.mutateAsync(valid);
    // TODO: toast/redirect
  };

  return (
    <section className="px-4 pb-8">
      <ProgressBar current={currentPage} total={totalPages} />

      {/* Page 1: Student Info */}
      {isFirstPage && (
        <div className="space-y-6 mt-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Student Information</h2>

          <div>
            <label className="block text-gray-700 mb-1">First Name (as listed on Canvas)</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Last Name (as listed on Canvas)</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="haritha@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Used only to look up your evaluation.</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">What is your group number?</label>
            <select
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select Group Number</option>
              {groupOptions.map((num) => (
                <option key={num} value={num}>
                  Group {num}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Question pages */}
      {!isFirstPage && (
        <>
          {!data && (isFetching || request) && (
            <p className="mt-6 text-gray-600">Loading form…</p>
          )}
          {isError && (
            <p role="alert" className="mt-6 text-red-600">
              {error?.message ?? "Failed to load form"}
            </p>
          )}
          {data && currentQuestion && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentQuestion.title}
                </h2>
                {currentQuestion.question_type === "scale" &&
                  currentQuestion.scale_labels && (
                    <AccordionRubric scaleLabels={currentQuestion.scale_labels} />
                  )}
              </div>

              {/* SCALE (per teammate) */}
              {currentQuestion.question_type === "scale" &&
                teammates.map((tm) => {
                  const name = fullName(tm);
                  const key = `${currentQuestion.question_id}-${tm.user_id}`;
                  return (
                    <div key={tm.user_id} className="mb-6">
                      <p className="font-medium text-gray-700 mb-2">{name}</p>

                      <CustomSlider
                        name={key}
                        min={currentQuestion.scale_min}
                        max={currentQuestion.scale_max}
                        step={1}
                        defaultValue={currentQuestion.scale_min}
                        marks
                        valueLabelDisplay="auto"
                        onChange={(_, val) =>
                          onScaleChange(
                            currentQuestion.question_id,
                            tm.user_id,
                            val as number
                          )
                        }
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1 px-1 mb-3">
                        {Array.from(
                          { length: currentQuestion.scale_max - currentQuestion.scale_min + 1 },
                          (_, i) => i + currentQuestion.scale_min
                        ).map((v) => (
                          <span key={v}>{v}</span>
                        ))}
                      </div>

                      <textarea
                        placeholder="Optional explanation…"
                        rows={2}
                        className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
                        onChange={(e) =>
                          onScaleComment(currentQuestion.question_id, tm.user_id, e.target.value)
                        }
                      />
                    </div>
                  );
                })}

              {/* TEXT (per teammate) */}
              {currentQuestion.question_type === "text" &&
                teammates.map((tm) => {
                  const key = `${currentQuestion.question_id}-${tm.user_id}`;
                  return (
                    <div key={tm.user_id} className="mb-6">
                      <label className="block text-gray-700 mb-1">{fullName(tm)}</label>
                      <textarea
                        placeholder="Explain your ratings / any issues…"
                        rows={3}
                        className="w-full border border-gray-300 p-3 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#861f41]"
                        onChange={(e) =>
                          onTextChange(currentQuestion.question_id, tm.user_id, e.target.value)
                        }
                      />
                    </div>
                  );
                })}

              {/* PRAISE (per teammate) */}
              {currentQuestion.question_type === "praise" &&
                teammates.map((tm) => {
                  const name = fullName(tm);
                  return (
                    <div key={tm.user_id} className="mb-6">
                      <label className="block text-gray-700 mb-1">{name}</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
                        placeholder={tpl(currentQuestion.placeholder_template, name)}
                        onChange={(e) =>
                          onPraiseChange(currentQuestion.question_id, tm.user_id, e.target.value)
                        }
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      <div className="flex justify-between mt-10">
        {currentPage > 0 ? (
          <button
            onClick={handlePrevious}
            className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            Previous
          </button>
        ) : (
          <span />
        )}

        <button
          onClick={currentPage === totalPages - 1 ? handleSubmit : handleNext}
          disabled={isFirstPage ? !email || !groupId : !data || submit.isPending}
          className="px-4 py-2 rounded bg-[#861f41] text-white hover:bg-[#6e1a36] disabled:opacity-60"
        >
          {currentPage === totalPages - 1
            ? submit.isPending ? "Submitting…" : "Submit"
            : "Next"}
        </button>
      </div>

      <p className="text-sm text-center mt-4 text-gray-600">
        Page {Math.min(currentPage + 1, totalPages)} of {totalPages} (
        {Math.round((Math.min(currentPage + 1, totalPages) / totalPages) * 100)}%)
      </p>
    </section>
  );
}
