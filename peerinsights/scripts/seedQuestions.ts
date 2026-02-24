// scripts/seedQuestions.ts
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local" }); // 👈 explicitly load your local env

import { connectDB } from "@/lib/mongodb";
import Question from "@/models/Question";

async function main() {
  await connectDB();

  // Upsert helper by title (idempotent)
  const upsert = async (doc: any) => {
    await Question.updateOne(
      { title: doc.title },
      { $setOnInsert: doc },
      { upsert: true }
    );
  };

  await upsert({
    title: "Individual Contribution",
    category: "contribution",
    description: "Rate how much this teammate contributed to the team.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Consistently goes beyond their required commitments. Did much more than others. Consistently makes important contributions that improve the team's work.",
      "4": "Often goes beyond their required commitments. Did more than others. Often makes important contributions that improve the team's work.",
      "3": "Completed their required commitments. Did a fair share of the team's work. Occasionally makes important contributions that improve the team's work.",
      "2": "Did not complete all of their required commitments, could have shared more of the workload. Has difficulty. Requires structure, directions and leadership.",
      "1": "Does not do a fair share of the team's work. Does not contribute.",
    },
  });

  await upsert({
    title: "Helping Others",
    category: "collaboration",
    description: "How much did this teammate help/support others?",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Monitors team members' progress and generously offers help and support to teammates who are having difficulty completing their work.",
      "4": "Notices when team members are having difficulty and makes an effort to offer help and support when convenient.",
      "3": "Helps teammates who ask for help.",
      "2": "Helps teammates who ask for help when it is convenient.",
      "1": "Does not help teammates even if asked.",
    },
  });

  await upsert({
    title: "Initiative",
    category: "initiative",
    description: "How independently and proactively do they work?",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Is very self-directed. Successfully problem-solves when faced with impasses or challenges.",
      "4": "Usually problem solves when faced with impasses or challenges. Almost never needs direction.",
      "3": "Tries to problem solve when faced with impasses or challenges but may not always be successful. Often needs direction.",
      "2": "Cannot problem solve and needs clear direction.",
      "1": "Cannot problem solve and does not take direction.",
    },
  });

  // Text box that appears after each scale section (Q1–Q3)
  await upsert({
    title: "Explain your answers / issues",
    category: "explanation",
    description:
      "After each rating, you may explain your answer or share any issues for that specific teammate.",
    question_type: "text",
    // convention: applies_to refers to the 1-based position of the scale questions in this survey
    applies_to: [1, 2, 3],
  });

  // Praise per teammate (not self)
  await upsert({
    title: "Praise",
    category: "recognition",
    description:
      "Is there anything you want to praise about this teammate? If so, for what?",
    question_type: "praise",
    placeholder_template:
      "Is there anything you want to praise about {{name}}? If so, for what?",
  });

  console.log("✅ Questions seeded");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
