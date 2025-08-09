export interface RatingInstruction {
  value: number;
  meaning: string;
}

export interface EvaluationQuestion {
  id: string;
  text: string;
  type: "rating" | "text";
  instructions?: RatingInstruction[];  // ✅ Added this line
}

export const evaluationQuestions: EvaluationQuestion[] = [
  {
    id: "q1",
    text: "Individual Contribution",
    type: "rating",
    instructions: [
      { value: 5, meaning: "Did much more than others" },
      { value: 4, meaning: "Did more than others" },
      { value: 3, meaning: "Did fair share" },
      { value: 2, meaning: "Did less than expected" },
      { value: 1, meaning: "Did not contribute enough" },
    ],
  },
  {
    id: "q2",
    text: "Helping Others",
    type: "rating",
    instructions: [
      { value: 5, meaning: "Proactively helps teammates" },
      { value: 1, meaning: "Does not help even when asked" },
    ],
  },
  {
    id: "q3",
    text: "Anything you want to praise about any teammate?",
    type: "text",
  },
];
