'use client';

import React from 'react';

export default function Instructions() {
  return (
    <section
      aria-labelledby="instructions-heading"
      className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-md shadow-sm"
    >
      <h2
        id="instructions-heading"
        className="text-sm font-semibold text-[#861f41] mb-4"
      >
        Evaluation Instructions
      </h2>

      <ul className="list-disc list-inside space-y-1 text-gray-700 leading-relaxed text-sm">
<li>
          This is not a group assignment, it is an individual assignment and you must do your own.
        </li>
        <li>
          Periodically each member of the team completes a Team Member Evaluation for the work done up to that point. This lets the instructor
understand the relative efforts and contributions of team members, as well as any conflicts.   </li>
        <li>
        This counts as a Classwork/Homework grade and is graded on an effort basis only. If you fill it out completely and thoughtfully then you
get full points otherwise you receive no points. Essentially an all or nothing scenario.  </li>
        <li>
          Use the provided rating scale to evaluate yourself and your teammates honestly.
        </li>
        <li>
          Anonymous average scores may be shared with the teammate being evaluated.
        </li>
        <li>
          Anonymous paraphrased comments may also be shared unless you indicate otherwise in the open-ended questions.
        </li>
      </ul>

      {/* <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Rubric</h3>
        <p className="text-gray-600">
          Each rating question includes a specific rubric to guide your evaluation. 
          Expand the rubric below each question to understand what each score means.
        </p>
      </div> */}
    </section>
  );
}
