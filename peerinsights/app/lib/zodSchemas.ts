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

/** ---------- create class (POST /api/classes) ---------- */
export const ClassGroupInputSchema = z.object({
  groupName: z.string().min(1),
  members: z.array(z.string().min(1)).min(1), // full names as strings
});

export const CreateClassRequestSchema = z.object({
  instructor_email: z.string().email(),
  instructor_first_name: z.string().min(1),
  instructor_last_name: z.string().min(1),
  courseName: z.string().min(1),
  term: z.string().min(1),
  year: z.coerce.number().int().min(1900),
  class: z.string().min(1), // section/code from CSV
  groups: z.array(ClassGroupInputSchema).min(1),
});
export type CreateClassRequest = z.infer<typeof CreateClassRequestSchema>;

/** Response mirrors backend sample */
export const CreatedStudentSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.literal("student"),
});
export const CreatedTeamSchema = z.object({
  _id: z.string(),
  class_id: z.string(),
  team_number: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  __v: z.number().int().optional(),   // <— make optional
  members: z.array(CreatedStudentSchema).min(1),
});


export const CreatedInstructorSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
});

export const CreatedClassSchema = z.object({
  _id: z.string(),
  name: z.string(),        // e.g., "Spring_2025_Capstone Project"
  section: z.string(),     // e.g., "CS_XXXX_..."
  term: z.string(),
  year: z.number().int(),
  instructor: CreatedInstructorSchema,
  teams: z.array(CreatedTeamSchema).min(1),
});

export const CreateClassResponseSchema = z.object({
  ok: z.literal(true),
  class: CreatedClassSchema,
});
export type CreateClassResponse = z.infer<typeof CreateClassResponseSchema>;

export type CreatedStudent = z.infer<typeof CreatedStudentSchema>;
export type CreatedTeam    = z.infer<typeof CreatedTeamSchema>;
export type CreatedClass   = z.infer<typeof CreatedClassSchema>;

// ==== UPDATE TEAMS (POST /api/classes/update-teams) ====
export const UpdateTeamsRequestSchema = z.object({
  instructor_email: z.string().email(),
  instructor_first_name: z.string().min(1),
  instructor_last_name: z.string().min(1),
  courseName: z.string().min(1),
  term: z.string().min(1),
  year: z.coerce.number().int().min(1900),
  class: z.string().min(1), // section/code, e.g. "CS_XXXX_345678909876543"
  groups: z.array(ClassGroupInputSchema).min(1),
});
export type UpdateTeamsRequest = z.infer<typeof UpdateTeamsRequestSchema>;

export const UpdateTeamsResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
  class: CreatedClassSchema,
});
export type UpdateTeamsResponse = z.infer<typeof UpdateTeamsResponseSchema>;

// (Optional) single-class fetch shape
export const GetClassResponseSchema = z.object({
  ok: z.literal(true),
  class: CreatedClassSchema,
});
export type GetClassResponse = z.infer<typeof GetClassResponseSchema>;

// ---- Assignments (Create + List) ----

// Raw shape as your API returns it
const AssignmentServerItemSchema = z.object({
  _id: z.string(),
  title: z.string(),
  start_date: z.string().datetime().or(z.string().min(10)),
  due_date: z.string().datetime().or(z.string().min(10)),
});



export const CreateAssignmentRequestSchema = z.object({
  instructor_email: z.string().email(),
  section: z.string().min(1),
  assignment_name: z.string().min(1),
  assignment_start_date: z.string().date().or(z.string().min(10)), // allow plain YYYY-MM-DD
  assignment_end_date: z.string().date().or(z.string().min(10)),
});
export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;

// Client-normalized shape your UI can use
export const AssignmentItemSchema = AssignmentServerItemSchema.transform(a => ({
  _id: a._id,
  name: a.title,
  start_date: a.start_date,
  end_date: a.due_date,
}));
export type AssignmentItem = z.infer<typeof AssignmentItemSchema>;

// Create response (normalize inside)
export const CreateAssignmentResponseSchema = z.object({
  ok: z.literal(true),
  assignment: AssignmentItemSchema, // normalized
  message: z.string().optional(),
});
export type CreateAssignmentResponse = z.infer<typeof CreateAssignmentResponseSchema>;

// List response (normalized)
export const ListAssignmentsResponseSchema = z.object({
  ok: z.literal(true),
  assignments: z.array(AssignmentItemSchema),
});
export type ListAssignmentsResponse = z.infer<typeof ListAssignmentsResponseSchema>;
