'use client';
import React, { useState } from 'react';
import { RatingInstruction } from './questions';

export default function AccordionRubric({ instructions }: { instructions: RatingInstruction[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm text-[#861f41] hover:underline focus:outline-none"
      >
        {open ? 'Hide Rubric' : 'Show Rubric'}
      </button>

      {open && (
        <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
          {instructions.map((item) => (
            <li key={item.value}>
              <strong>{item.value}:</strong> {item.meaning}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
