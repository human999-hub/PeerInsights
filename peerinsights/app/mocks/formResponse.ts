// app/mocks/formResponse.ts
import { FormResponseSchema } from "@/app/lib/zodSchemas";
import type { FormResponse } from "@/app/lib/zodSchemas";

export const mockFormResponse: FormResponse = FormResponseSchema.parse({
  ok: true,
  is_active: true,
  student: {
    user_id: "689b582abc111adf8367de5d",
    first_name: "Haritha",
    last_name: "Injam",
    email: "haritha@example.com",
  },
  class: {
    class_id: "689b582bbc111adf8367de6b",
    name: "Fall_2025_Capstone_Project",
    term: "Fall",
    year: 2025,
  },
  assignment: {
    assignment_id: "689b582bbc111adf8367de7d",
    title: "Peer_Evaluation",
    start_date: "2025-08-11T15:05:14.666Z",
    due_date: "2025-08-19T15:05:14.666Z",
  },
  team: {
    team_id: "689b582bbc111adf8367de6e",
    team_number: "Group_1",
    members: [
      {
        user_id: "689b582abc111adf8367de5d",
        first_name: "Haritha",
        last_name: "Injam",
        email: "haritha@example.com",
      },
      {
        user_id: "689b582abc111adf8367de62",
        first_name: "Sushma",
        last_name: "Nukala",
        email: "sushma@example.com",
      },
    ],
  },
  questions: [
    {
      question_id: "689b5c3c80bc2c737a5dd99d",
      title: "Individual Contribution",
      question_type: "scale",
      scale_min: 1,
      scale_max: 5,
      scale_labels: {
        "1": "Does not contribute.",
        "5": "Consistently goes beyond.",
      },
    },
    {
      question_id: "689b5c3c80bc2c737a5dd9a0",
      title: "Explain your answers",
      question_type: "text",
    },
  ],
});
