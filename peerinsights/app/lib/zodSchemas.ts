// peerinsights/app/lib/zodSchemas.ts
import { z } from "zod";

/** -------- fetch form (POST /api/form) ---------- */
export const FormRequestSchema = z.object({
  student_email: z.string().email(),
  team_number: z.string().regex(/^Group_\d+$/, "Expected something like Group_1"),
});

const StudentSchema = z.object({
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
});

const ClassSchema = z.object({
  class_id: z.string(),
  name: z.string(),
  term: z.string(),
  year: z.number(),
});

const AssignmentSchema = z.object({
  assignment_id: z.string(),
  title: z.string(),
  start_date: z.string().datetime(),
  due_date: z.string().datetime(),
});

const TeamMemberSchema = StudentSchema; // same shape
const TeamSchema = z.object({
  team_id: z.string(),
  team_number: z.string(),
  members: z.array(TeamMemberSchema).min(1),
});
const NumericStringKey = z.string().regex(/^\d+$/);
const ScaleQuestionSchema = z.object({
  question_id: z.string(),
  title: z.string(),
  question_type: z.literal("scale"),
  scale_min: z.number().int(),
  scale_max: z.number().int(),
//   scale_labels: z.record(z.string()), // "1": "label", ...

scale_labels: z.record(NumericStringKey, z.string()),
});

const TextQuestionSchema = z.object({
  question_id: z.string(),
  title: z.string(),
  question_type: z.literal("text"),
});

const PraiseQuestionSchema = z.object({
  question_id: z.string(),
  title: z.string(),
  question_type: z.literal("praise"),
  placeholder_template: z.string().optional(),
});

export const QuestionSchema = z.discriminatedUnion("question_type", [
  ScaleQuestionSchema,
  TextQuestionSchema,
  PraiseQuestionSchema,
]);

export const FormResponseSchema = z.object({
  ok: z.boolean(),
  is_active: z.boolean(),
  student: StudentSchema,
  class: ClassSchema,
  assignment: AssignmentSchema,
  team: TeamSchema,
  questions: z.array(QuestionSchema).min(1),
});

export type FormRequest = z.infer<typeof FormRequestSchema>;
export type FormResponse = z.infer<typeof FormResponseSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;

/** -------- submit form (POST /api/submit) ---------- */
/* Client state → payload (one answer per teammate x per question) */
// const ScaleAnswerSchema = z.object({
//   question_id: z.string(),
//   teammate_user_id: z.string(),
//   value: z.number().int(),
// });

// const TextAnswerSchema = z.object({
//   question_id: z.string(),
//   teammate_user_id: z.string().optional(), // general text may be per-teammate or overall
//   text: z.string().max(5000).optional().default(""),
// });

// const PraiseAnswerSchema = z.object({
//   question_id: z.string(),
//   teammate_user_id: z.string(),
//   text: z.string().max(1000).optional().default(""),
// });

export const RatingItemSchema = z.object({
  to_student_id: z.string(),
  question_id: z.string(),
  rating: z.number().int(),
});

export const CommentItemSchema = z.object({
  to_student_id: z.string(),
  question_id: z.string(),
  comment_text: z.string().max(5000).catch(""),  // keep ""
});

export const PraiseItemSchema = z.object({
  to_student_id: z.string(),
  question_id: z.string(),                       // REQUIRED
  praise_text: z.string().max(1000).catch(""),   // keep ""
});

export const SubmissionPayloadSchema = z.object({
  assignment_id: z.string(),
  team_id: z.string(),
  from_student_id: z.string(),
  ratings: z.array(RatingItemSchema),
  comments: z.array(CommentItemSchema),
  praises: z.array(PraiseItemSchema),
});


export type SubmissionPayload = z.infer<typeof SubmissionPayloadSchema>;

export const SubmitResponseSchema = z.object({
  ok: z.boolean(),
  submission_id: z.string().optional(),
});
export type SubmitResponse = z.infer<typeof SubmitResponseSchema>;

