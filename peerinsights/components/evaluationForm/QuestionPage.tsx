"use client";

import React, { useState } from "react";
import CustomSlider from "./CustomSlider";
import { evaluationQuestions, EvaluationQuestion } from "./questions";
import { teammates } from "./teammates";
import ProgressBar from "./ProgressBar";
import { groupOptions, initialStudentInfo, StudentInfo } from "./student";

export default function QuestionPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [rubricOpen, setRubricOpen] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>(initialStudentInfo);

  const totalPages = evaluationQuestions.length + 1; // +1 for student info page
  const isFirstPage = currentPage === 0;
  const isLastQuestionPage = currentPage === totalPages - 1;
  const currentQuestion: EvaluationQuestion | null =
    currentPage > 0 ? evaluationQuestions[currentPage - 1] : null;

  const handleRatingChange = (teammateId: string, value: number) => {
    if (!currentQuestion) return;
    setRatings((prev) => ({
      ...prev,
      [`${currentQuestion.id}-${teammateId}`]: value,
    }));
  };

  const handleCommentChange = (teammateId: string, value: string) => {
    if (!currentQuestion) return;
    setComments((prev) => ({
      ...prev,
      [`${currentQuestion.id}-${teammateId}`]: value,
    }));
  };

  const handleStudentInfoChange = (
    field: keyof StudentInfo,
    value: string | number
  ) => {
    setStudentInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setRubricOpen(false);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setRubricOpen(false);
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    console.log("Student Info:", studentInfo);
    console.log("Ratings:", ratings);
    console.log("Comments:", comments);
    // TODO: API integration
  };

  return (
    <section className="px-4 pb-8">
      <ProgressBar current={currentPage} total={totalPages} />

      {/* Page 1: Student Info */}
      {isFirstPage && (
        <div className="space-y-6 mt-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Student Information
          </h2>

          <div>
            <label className="block text-gray-700 mb-1">First Name (as listed on Canvas)</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
              value={studentInfo.firstName}
              onChange={(e) => handleStudentInfoChange("firstName", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Last Name (as listed on Canvas)</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
              value={studentInfo.lastName}
              onChange={(e) => handleStudentInfoChange("lastName", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">What is your group number?</label>
            <select
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
              value={studentInfo.groupId}
              onChange={(e) => handleStudentInfoChange("groupId", Number(e.target.value))}
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

      {/* Question Pages */}
      {!isFirstPage && currentQuestion && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-800">
              {currentQuestion.text}
            </h2>
            {currentQuestion.instructions && (
              <button
                className="text-sm text-[#861f41] underline"
                onClick={() => setRubricOpen((prev) => !prev)}
              >
                {rubricOpen ? "Hide Rubric" : "Show Rubric"}
              </button>
            )}
          </div>

          {/* Rubric Accordion */}
          {rubricOpen && currentQuestion.instructions && (
            <div className="mb-4 border-l-4 border-[#861f41] bg-[#f9f4f5] p-4 rounded text-sm">
              <ul className="space-y-1">
                {currentQuestion.instructions.map((item) => (
                  <li key={item.value}>
                    <strong>{item.value}</strong>: {item.meaning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Teammate Inputs */}
          {teammates.map((tm) => (
            <div key={tm.id} className="mb-6">
              <p className="font-medium text-gray-700 mb-2">{tm.name}</p>

              {currentQuestion.type === "rating" && (
                <>
                  <CustomSlider
                    name={`${currentQuestion.id}-${tm.id}`}
                    min={1}
                    max={5}
                    step={1}
                    defaultValue={1}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(_, val) => handleRatingChange(tm.id, val as number)}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1 px-1 mb-3">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <span key={val}>{val}</span>
                    ))}
                  </div>

                  <textarea
                    placeholder="Optional explanation..."
                    rows={2}
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
                    onChange={(e) => handleCommentChange(tm.id, e.target.value)}
                  />
                </>
              )}

              {currentQuestion.type === "text" && (
                <textarea
                  placeholder="Type your response..."
                  rows={3}
                  className="w-full border border-gray-300 p-3 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#861f41]"
                  onChange={(e) => handleCommentChange(tm.id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {/* <div className="flex justify-between mt-10">
        <button
          disabled={isFirstPage}
          onClick={handlePrevious}
          className={`px-4 py-2 rounded ${
            isFirstPage
              ? "bg-gray-300 cursor-not-allowed text-gray-700"
              : "bg-[#861f41] text-white hover:bg-[#6e1a36]"
          }`}
        >
          Previous
        </button> */}

        {/* Show "Submit" on last question page instead of "Next" */}
        {/* {!isFirstPage && isLastQuestionPage ? (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-[#861f41] text-white hover:bg-[#6e1a36]"
          >
            Submit
          </button>
        ) : (
          !isFirstPage && (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded bg-[#861f41] text-white hover:bg-[#6e1a36]"
            >
              Next
            </button>
          )
        )}
      </div> */}
      {/* Pagination Controls */}
<div className="flex justify-between mt-10">
  {/* Previous: only shown after page 1 */}
  {currentPage > 0 ? (
    <button
      onClick={handlePrevious}
      className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
    >
      Previous
    </button>
  ) : (
    <span /> // placeholder to maintain spacing
  )}

  {/* Right-side button: Next or Submit */}
  <button
    onClick={isLastQuestionPage ? handleSubmit : handleNext}
    className="px-4 py-2 rounded bg-[#861f41] text-white hover:bg-[#6e1a36]"
  >
    {isLastQuestionPage ? "Submit" : "Next"}
  </button>
</div>


      {/* Page Info */}
      <p className="text-sm text-center mt-4 text-gray-600">
        Page {currentPage + 1} of {totalPages} (
        {Math.round(((currentPage + 1) / totalPages) * 100)}%)
      </p>
    </section>
  );
}
