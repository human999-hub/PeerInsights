// components/evaluationForm/AccordionRubric.tsx
'use client';
import React, { useState } from 'react';

type Props = { scaleLabels: Record<string, string> };

export default function AccordionRubric({ scaleLabels }: Props) {
  const [open, setOpen] = useState(false);

  const entries = Object.entries(scaleLabels).sort(
    ([a], [b]) => Number(a) - Number(b)
  );

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm text-primary hover:underline focus:outline-none"
      >
        {open ? 'Hide Rubric' : 'Show Rubric'}
      </button>

      {open && (
        <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
          {entries.map(([val, meaning]) => (
            <li key={val}>
              <strong>{val}:</strong> {meaning}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
