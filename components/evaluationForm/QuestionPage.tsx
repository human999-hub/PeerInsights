// components/evaluationForm/QuestionPage.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFormMetaQuery, useSubmitEvaluation } from "@/app/lib/queries";
import {
  FormRequestSchema,
  SubmissionPayloadSchema,
  type Question,
} from "@/app/lib/zodSchemas";
import ProgressBar from "./ProgressBar";
import ScaleQuestion from "./ScaleQuestion";
// import TextQuestion from "./TextQuestion";
import PraiseQuestion from "./PraiseQuestion";
import LookupForm from "./LookupForm";

type TM = { user_id: string; first_name: string; last_name: string };

export default function QuestionPage() {
  // steps - 0 is lookup form and > or 1 are questions
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);

  // lookup form states
  const [email, setEmailId] = useState("");
  const [groupId, setGroupId] = useState<number | "">("");

  // trigger fetch when email+group are present
  const request = useMemo(() => {
    if (!email || !groupId) return null;
    return FormRequestSchema.parse({
      student_email: email.trim(),
      team_number: `Group_${groupId}`,
    });
  }, [email, groupId]);

  const { data, isFetching, isError, error, refetch } = useFormMetaQuery(
    request,
    started
  );

  const submit = useSubmitEvaluation();

  const questions = data?.questions ?? [];
  const teammates = (data?.team.members ?? []) as TM[];
  const numQuestions = questions.length;
  const currentUserId = data?.student.user_id;
  
// const recipients = teammates.filter(tm => tm.user_id !== currentUserId);
  // const totalPages = 1 + numQuestions; // 1 = student info
  // 👉 only go to first question after data loads successfully
  useEffect(() => {
    if (started && !isFetching && !isError && numQuestions > 0 && step === 0) {
      setStep(1);
    }
  }, [started, isFetching, isError, numQuestions, step]);
  // If error, keep/return to lookup step to avoid weird pagination
  useEffect(() => {
    if (isError) setStep(0);
  }, [isError]);

  // const onLookupNext = () => {
  //   setStarted(true);
  //   setStep(1);
  // };

  const currentQuestion: Question | null =
    step >= 1 && questions.length > 0 ? questions[step - 1] : null;

  // answers (keyed by `${qid}-${uid}`)
  const [scaleRatings, setScaleRatings] = useState<Record<string, number>>({});
  const [scaleComments, setScaleComments] = useState<Record<string, string>>(
    {}
  );
  const [textPerTeammate, setTextPerTeammate] = useState<
    Record<string, string>
  >({});
  const [praiseTexts, setPraiseTexts] = useState<Record<string, string>>({});

  const onScaleChange = (qid: string, uid: string, value: number) =>
    setScaleRatings((p) => ({ ...p, [`${qid}-${uid}`]: value }));
  const onScaleComment = (qid: string, uid: string, text: string) =>
    setScaleComments((p) => ({ ...p, [`${qid}-${uid}`]: text }));
  // const onTextChange = (qid: string, uid: string, text: string) =>
  //   setTextPerTeammate((p) => ({ ...p, [`${qid}-${uid}`]: text }));
  const onPraiseChange = (qid: string, uid: string, text: string) =>
    setPraiseTexts((p) => ({ ...p, [`${qid}-${uid}`]: text }));

  const isLastQuestionPage = step === numQuestions && numQuestions > 0;

  const isCurrentScaleQuestionComplete = (): boolean => {
    if (!currentQuestion || currentQuestion.question_type !== "scale")
      return true;
    return teammates.every((tm) =>
      // scaleRatings.hasOwnProperty(
      //   `${currentQuestion.question_id}-${tm.user_id}`
      // )

      Object.prototype.hasOwnProperty.call(
        scaleRatings,
        `${currentQuestion.question_id}-${tm.user_id}`
      )
    );
  };

  //accumulators that survive page changes
  const [ratingsAcc, setRatingsAcc] = useState<
    { question_id: string; to_student_id: string; rating: number }[]
  >([]);
  const [commentsAcc, setCommentsAcc] = useState<
    { question_id: string; to_student_id: string; comment_text: string }[]
  >([]);
  const [praisesAcc, setPraisesAcc] = useState<
    { question_id: string; to_student_id: string; praise_text: string }[]
  >([]);

  const clearPageState = () => {
    setScaleRatings({});
    setScaleComments({});
    setTextPerTeammate({});
    setPraiseTexts({});
  };


  const buildBundlesForCurrentQuestion = () => {
    if (!currentQuestion) {
      return {
        ratings: [] as typeof ratingsAcc,
        comments: [] as typeof commentsAcc,
        praises: [] as typeof praisesAcc,
      };
    }
    const qid = currentQuestion.question_id;

    if (currentQuestion.question_type === "scale") {
      const newRatings: typeof ratingsAcc = [];
      const newComments: typeof commentsAcc = [];
      teammates.forEach((tm) => {
        const key = `${qid}-${tm.user_id}`;
        if (key in scaleRatings) {
          newRatings.push({
            question_id: qid,
            to_student_id: tm.user_id,
            rating: Math.round(Number(scaleRatings[key])),
          });
        }
        newComments.push({
          question_id: qid,
          to_student_id: tm.user_id,
          comment_text: scaleComments[key] ?? "",
        });
      });
      return {
        ratings: newRatings,
        comments: newComments,
        praises: [] as typeof praisesAcc,
      };
    }

    if (currentQuestion.question_type === "text") {
      const newComments: typeof commentsAcc = [];
      teammates.forEach((tm) => {
        const key = `${qid}-${tm.user_id}`;
        
          newComments.push({
            question_id: qid,
            to_student_id: tm.user_id,
            comment_text: textPerTeammate[key] ?? "",
          });
        
      });
      return {
        ratings: [] as typeof ratingsAcc,
        comments: newComments,
        praises: [] as typeof praisesAcc,
      };
    }

    if (currentQuestion.question_type === "praise") {
      const newPraises: typeof praisesAcc = [];
      const praiseTargets = teammates.filter(
        (tm) => tm.user_id !== data?.student.user_id
      );

      praiseTargets.forEach((tm) => {
        const key = `${qid}-${tm.user_id}`;
      
          newPraises.push({
            question_id: qid,
            to_student_id: tm.user_id,
            praise_text: praiseTexts[key] ?? "",
          });
        
      });

      return {
        ratings: [] as typeof ratingsAcc,
        comments: [] as typeof commentsAcc,
        praises: newPraises,
      };
    }

    return {
      ratings: [] as typeof ratingsAcc,
      comments: [] as typeof commentsAcc,
      praises: [] as typeof praisesAcc,
    };
  };

  const flushCurrentQuestionToAccumulators = () => {
    if (!currentQuestion) return;
    const qid = currentQuestion.question_id;
    const { ratings, comments, praises } = buildBundlesForCurrentQuestion();

    setRatingsAcc((prev) => [
      ...prev.filter((r) => r.question_id !== qid),
      ...ratings,
    ]);
    setCommentsAcc((prev) => [
      ...prev.filter((c) => c.question_id !== qid),
      ...comments,
    ]);
    setPraisesAcc((prev) => [
      ...prev.filter((p) => p.question_id !== qid),
      ...praises,
    ]);
  };

  const handleNext = () => {
    if (
      currentQuestion?.question_type === "scale" &&
      !isCurrentScaleQuestionComplete()
    ) {
      alert("Please rate all teammates before proceeding.");
      return;
    }
    queueMicrotask(() => {
      // ensures latest onChange is applied
      flushCurrentQuestionToAccumulators();
      clearPageState();
      if (step < numQuestions) setStep((s) => s + 1);
    });
  };

  const handlePrevious = () => {
    // Save this page too so you don't lose work when going back
    flushCurrentQuestionToAccumulators();
    if (step > 0) setStep((s) => s - 1);
  };

  // const handleSubmit = async () => {
  //   if (!data) return;

  //   try {
  //     if (
  //       currentQuestion?.question_type === "scale" &&
  //       !isCurrentScaleQuestionComplete()
  //     ) {
  //       alert("Please rate all teammates before submitting.");
  //       return;
  //     }

  //     // Ensure the last onChange from any controlled inputs is committed
  //     await Promise.resolve();

  //     // Merge current page bundles with accumulators (avoid relying on async setState)
  //     let finalRatings = ratingsAcc;
  //     let finalComments = commentsAcc;
  //     let finalPraises = praisesAcc;

  //     if (currentQuestion) {
  //       const qid = currentQuestion.question_id;
  //       const { ratings, comments, praises } = buildBundlesForCurrentQuestion();

  //       finalRatings = [
  //         ...ratingsAcc.filter((r) => r.question_id !== qid),
  //         ...ratings,
  //       ];
  //       finalComments = [
  //         ...commentsAcc.filter((c) => c.question_id !== qid),
  //         ...comments,
  //       ];
  //       finalPraises = [
  //         ...praisesAcc.filter((p) => p.question_id !== qid),
  //         ...praises,
  //       ];
  //     }

  //     const payload = {
  //       assignment_id: data.assignment.assignment_id,
  //       team_id: data.team.team_id,
  //       from_student_id: data.student.user_id,
  //       ratings: finalRatings,
  //       comments: finalComments,
  //       praises: finalPraises,
  //     };

  //     const valid = SubmissionPayloadSchema.parse(payload);
  //     await submit.mutateAsync(valid);
  //     alert("Submitted!");
  //   } catch (e) {
  //     console.error(e);
  //     alert((e as Error).message || "Submit failed");
  //   }
  // };

  // ---------- Rehydrate page state when switching pages ----------

const handleSubmit = async () => {
  if (!data) return;

  try {
    // Flush last onChange from controlled inputs
    await Promise.resolve();

    // Build quick lookup maps from accumulators
    const rMap = new Map<string, number>();
    ratingsAcc.forEach(r => rMap.set(`${r.question_id}-${r.to_student_id}`, r.rating));

    const cMap = new Map<string, string>();
    commentsAcc.forEach(c => cMap.set(`${c.question_id}-${c.to_student_id}`, c.comment_text));

    const pMap = new Map<string, string>();
    praisesAcc.forEach(p => pMap.set(`${p.question_id}-${p.to_student_id}`, p.praise_text));

    const allRatings: typeof ratingsAcc = [];
    const allComments: typeof commentsAcc = [];
    const allPraises: typeof praisesAcc = [];

    for (const q of questions) {
      if (q.question_type === "scale") {
        for (const tm of teammates) {
          const key = `${q.question_id}-${tm.user_id}`;

          // ratings are required for every teammate on every scale question
          const rating =
            (currentQuestion?.question_id === q.question_id ? scaleRatings[key] : undefined) ??
            rMap.get(key);

          if (rating == null) {
            alert("Please rate all teammates before submitting.");
            return;
          }

          allRatings.push({
            question_id: q.question_id,
            to_student_id: tm.user_id,
            rating: Math.round(Number(rating)),
          });

          // optional explanation: ALWAYS push, default ""
          const comment =
            (currentQuestion?.question_id === q.question_id ? scaleComments[key] : undefined) ??
            cMap.get(key) ??
            "";
          allComments.push({
            question_id: q.question_id,
            to_student_id: tm.user_id,
            comment_text: comment,
          });
        }
      }

      if (q.question_type === "text") {
        for (const tm of teammates) {
          const key = `${q.question_id}-${tm.user_id}`;
          const comment =
            (currentQuestion?.question_id === q.question_id ? textPerTeammate[key] : undefined) ??
            cMap.get(key) ??
            "";
          allComments.push({
            question_id: q.question_id,
            to_student_id: tm.user_id,
            comment_text: comment,
          });
        }
      }

      if (q.question_type === "praise") {
        for (const tm of teammates) {
          if (tm.user_id === data.student.user_id) continue; // exclude self
          const key = `${q.question_id}-${tm.user_id}`;
          const praise =
            (currentQuestion?.question_id === q.question_id ? praiseTexts[key] : undefined) ??
            pMap.get(key) ??
            "";
          allPraises.push({
            question_id: q.question_id,
            to_student_id: tm.user_id,
            praise_text: praise,
          });
        }
      }
    }

    // (Optional) sanity check — remove after verifying
    const numScaleOrText = questions.filter(q => q.question_type === "scale" || q.question_type === "text").length;
    const numPraise = questions.filter(q => q.question_type === "praise").length;
    const expectedComments = teammates.length * numScaleOrText;
    const expectedPraises  = (teammates.length - 1) * numPraise;
    console.log({ finalCommentsLen: allComments.length, finalPraisesLen: allPraises.length, expectedComments, expectedPraises });

    const payload = {
      assignment_id: data.assignment.assignment_id,
      team_id: data.team.team_id,
      from_student_id: data.student.user_id,
      ratings: allRatings,
      comments: allComments,
      praises: allPraises,
    };

    const valid = SubmissionPayloadSchema.parse(payload);
    await submit.mutateAsync(valid);
    alert("Submitted!");
  } catch (e) {
    console.error(e);
    alert((e as Error).message || "Submit failed");
  }
};


  useEffect(() => {
    if (!currentQuestion) return;

    // start with a clean slate
    clearPageState();

    const qid = currentQuestion.question_id;

    if (currentQuestion.question_type === "scale") {
      const restoredRatings: Record<string, number> = {};
      ratingsAcc.forEach((r) => {
        if (r.question_id === qid) {
          restoredRatings[`${qid}-${r.to_student_id}`] = r.rating;
        }
      });

      const restoredScaleComments: Record<string, string> = {};
      commentsAcc.forEach((c) => {
        if (c.question_id === qid) {
          restoredScaleComments[`${qid}-${c.to_student_id}`] = c.comment_text;
        }
      });

      setScaleRatings(restoredRatings);
      setScaleComments(restoredScaleComments);
    }

    if (currentQuestion.question_type === "text") {
      const restored: Record<string, string> = {};
      commentsAcc.forEach((c) => {
        if (c.question_id === qid) {
          restored[`${qid}-${c.to_student_id}`] = c.comment_text;
        }
      });
      setTextPerTeammate(restored);
    }

    if (currentQuestion.question_type === "praise") {
      const restored: Record<string, string> = {};
      praisesAcc.forEach((p) => {
        if (p.question_id === qid) {
          restored[`${qid}-${p.to_student_id}`] = p.praise_text;
        }
      });
      setPraiseTexts(restored);
    }
  }, [currentQuestion, ratingsAcc, commentsAcc, praisesAcc]);

  if (submit.isSuccess && submit.data?.ok) {
    return (
      <section className="mb-8 rounded-md border border-green-200 bg-green-50 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-green-800">Thank you!</h2>
        <p className="mt-2 text-black-700">
          Your evaluation was submitted successfully.
        </p>
      </section>
    );
  }
  const haveQuestions = !!data && numQuestions > 0;
  const lookupErrorMessage =
    step === 0 && isError ? error?.message ?? "Failed to load form" : "";

  return (
    // className="px-4 pb-8"
    <section className="bg-light-maroon mb-8 p-6 bg-gray-50 border border-gray-200 rounded-md shadow-sm">
      {/* Progress only when questions exist */}
      {haveQuestions && step >= 1 && (
        <ProgressBar current={step - 1} total={numQuestions} />
      )}
      {/* Lookup page */}
      {step === 0 && (
        <LookupForm
          email={email}
          groupId={groupId}
          setEmail={setEmailId}
          setGroupId={setGroupId}
          onNext={() => {
            if (!started) setStarted(true);
            else refetch(); // retry if already started
          }}
          loading={started && isFetching}
          errorMessage={lookupErrorMessage} // ⬅️ show server message UNDER the form
        />
      )}

      {/* Loading */}
      {/* {started && isFetching && (
        <p className="mt-6 text-gray-600">Loading form…</p>
      )} */}
      {/* Error banner */}
      {/* {isError && (
        <div className="mt-6 flex flex-col items-center justify-center">
          <div role="alert" className="text-red-600">
            {error?.message ?? "Failed to load form"}
          </div>
          <div className="mt-4">
            <button className="button-primary" onClick={() => setStep(0)}>
              Go back
            </button>
          </div>
        </div>
      )} */}

      {/* Question pages */}
      {haveQuestions && step >= 1 && currentQuestion && (
        <>
          <div className="mt-6">
            {currentQuestion.question_type === "scale" && (
              <ScaleQuestion
              currentUserId={currentUserId ?? ''}
                question={currentQuestion}
                teammates={teammates}
                scaleRatings={scaleRatings}
                scaleComments={scaleComments}
                onScaleChange={onScaleChange}
                onScaleComment={onScaleComment}
                showErrors={!isCurrentScaleQuestionComplete()}
              />
            )}
            {/* {currentQuestion.question_type === "text" && (
              <TextQuestion
                question={currentQuestion}
                teammates={teammates}
                onTextChange={onTextChange}
              />
            )} */}
            {currentQuestion.question_type === "praise" && (
              <PraiseQuestion
                question={currentQuestion}
                teammates={teammates.filter(
                  (tm) => tm.user_id !== currentUserId
                )}
                onPraiseChange={onPraiseChange}
              />
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between mt-10">
            <button
              className="button-primary disabled:opacity-50"
              onClick={handlePrevious}
              disabled={step <= 1}
            >
              Previous
            </button>
            {isLastQuestionPage ? (
              <button
                className="button-primary"
                onClick={handleSubmit}
                disabled={!data}
              >
                Submit
              </button>
            ) : (
              <button
                className="button-primary"
                onClick={handleNext}
                disabled={!data || !currentQuestion}
              >
                Next
              </button>
            )}
          </div>

          {/* Page indicator — ONLY when questions exist */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Page {step} of {numQuestions} (
            {Math.round((step / numQuestions) * 100)}%)
          </p>
        </>
      )}
      {/* IMPORTANT: remove the generic error banner here when step === 0.
          If you want a banner on question pages, you can add:
      */}
      {step >= 1 && isError && (
        <div className="mt-6 text-center text-red-600" role="alert">
          {error?.message ?? "Failed to load form"}
        </div>
      )}
    </section>
  );
}
