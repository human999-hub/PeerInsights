// peerinsights/app/lib/zodSchemas.ts
import { z } from "zod";
// Evaluation Form Schemas
/** -------- fetch form (POST /api/form) ---------- */
export const FormRequestSchema = z.object({
  student_email: z.string().email(),
  team_number: z
    .string()
    .regex(/^Group_\d+$/, "Expected something like Group_1"),
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
  comment_text: z.string().max(5000).catch(""), // keep ""
});

export const PraiseItemSchema = z.object({
  to_student_id: z.string(),
  question_id: z.string(), // REQUIRED
  praise_text: z.string().max(1000).catch(""), // keep ""
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

// ---- Classes (Create, Update Teams, Fetch) ----
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
  __v: z.number().int().optional(), // <— make optional
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
  name: z.string(), // e.g., "Spring_2025_Capstone Project"
  section: z.string(), // e.g., "CS_XXXX_..."
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
export type CreatedTeam = z.infer<typeof CreatedTeamSchema>;
export type CreatedClass = z.infer<typeof CreatedClassSchema>;

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

// ---- Assignments (Create + List + Update) ----

const Ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

// Accept both wire formats and coerce types
const AssignmentServerFlexibleSchema = z.object({
  // id variants
  _id: z.union([z.string(), z.number()]).optional(),
  assignment_id: z.union([z.string(), z.number()]).optional(),

  // name/title variants
  title: z.string().optional(),
  name: z.string().optional(),
  assignment_name: z.string().optional(),

  // start date variants (string | Date)
  start_date: z.union([z.string(), z.date()]).optional(),
  startDate: z.union([z.string(), z.date()]).optional(),

  // end/due date variants (string | Date)
  due_date: z.union([z.string(), z.date()]).optional(),
  end_date: z.union([z.string(), z.date()]).optional(),
  dueDate: z.union([z.string(), z.date()]).optional(),
  endDate: z.union([z.string(), z.date()]).optional(),
});

// to YYYY-MM-DD
function toYMD(v: unknown): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

// Client-normalized object used across the app
export const AssignmentItemSchema = AssignmentServerFlexibleSchema.transform(
  (a) => {
    const id = a._id ?? a.assignment_id; // _id OR assignment_id
    const name = a.title ?? a.name ?? a.assignment_name; // title/name/assignment_name
    const start = a.start_date ?? a.startDate; // start_date/startDate
    const end = a.due_date ?? a.end_date ?? a.dueDate ?? a.endDate; // due/end variants
    return {
      _id: String(id ?? ""),
      name: String(name ?? ""),
      start_date: toYMD(start),
      end_date: toYMD(end),
    };
  },
).superRefine((v, ctx) => {
  if (!v._id)
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Missing _id" });
  if (!v.name)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Missing name/title",
    });
  if (!v.start_date)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Missing start_date",
    });
  if (!v.end_date)
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Missing end_date" });
});

export type AssignmentItem = z.infer<typeof AssignmentItemSchema>;

// ----- Create -----
export const CreateAssignmentRequestSchema = z.object({
  instructor_email: z.string().email(),
  section: z.string().min(1),
  assignment_name: z.string().min(1),
  assignment_start_date: Ymd,
  assignment_end_date: Ymd,
});
export type CreateAssignmentRequest = z.infer<
  typeof CreateAssignmentRequestSchema
>;

export const CreateAssignmentResponseSchema = z.object({
  ok: z.literal(true),
  assignment: AssignmentItemSchema, // normalized
  message: z.string().optional(),
});
export type CreateAssignmentResponse = z.infer<
  typeof CreateAssignmentResponseSchema
>;

// ----- List -----
export const ListAssignmentsResponseSchema = z.object({
  ok: z.literal(true),
  assignments: z.array(AssignmentItemSchema),
});
export type ListAssignmentsResponse = z.infer<
  typeof ListAssignmentsResponseSchema
>;

// ----- Update -----
export const UpdateAssignmentRequestSchema = z.object({
  instructor_email: z.string().email(),
  section: z.string().min(1),
  assignment_id: z.string().min(1),
  assignment_name: z.string().min(1),
  assignment_start_date: Ymd,
  assignment_end_date: Ymd,
});
export type UpdateAssignmentRequest = z.infer<
  typeof UpdateAssignmentRequestSchema
>;

export const UpdateAssignmentResponseSchema = z.object({
  ok: z.literal(true),
  assignment: AssignmentItemSchema,
  message: z.string().optional(),
});
export type UpdateAssignmentResponse = z.infer<
  typeof UpdateAssignmentResponseSchema
>;

// ========= AUTH (register / login) =========

export const RoleSchema = z.enum(["student", "instructor", "ta"]);

export const AuthUserSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: RoleSchema,
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

// ---- Register (POST /api/auth/register) ----
// backend only allows instructor / ta here
export const RegisterRequestSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["instructor", "ta"]),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const RegisterResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
  user: AuthUserSchema, // role will be "instructor" | "ta"
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// ---- Login (POST /api/auth/login) ----

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: RoleSchema, // "student" | "instructor" | "ta"
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  ok: z.literal(true),
  token: z.string(),
  user: AuthUserSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ---- Responses: Instructor Summary (GET /api/responses/instructor-summary) ----

export const UserRoleSchema = z.enum(["student", "instructor", "ta"]);

export const SummaryUserSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: UserRoleSchema,
});
export const SummaryQuestionInfoSchema = z.object({
  question_id: z.string().nullable(),
  qid: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
});

export const SummaryResponseItemSchema = z.object({
  response_id: z.string(),
  from_student_id: z.string(),
  to_student_id: z.string(),
  question: SummaryQuestionInfoSchema, // ✅ changed
  rating: z.number().int(),
});

export const SummaryCommentItemSchema = z.object({
  comment_id: z.string(),
  from_student_id: z.string(),
  to_student_id: z.string(),
  question: SummaryQuestionInfoSchema, // ✅ changed
  comment_text: z.string(),
});

export const SummaryPraiseItemSchema = z.object({
  praise_id: z.string(),
  from_student_id: z.string(),
  to_student_id: z.string(),
  question: SummaryQuestionInfoSchema.nullable(), // ✅ can be null
  praise_text: z.string(),
});

export const SummarySubmissionSchema = z.object({
  submission_id: z.string(),
  assignment_id: z.string(),
  team_id: z.string(),
  from_student_id: z.string(),
  submitted_at: z.string().datetime(),
  single_lock: z.string(), // looks like "S"
  responses: z.array(SummaryResponseItemSchema),
  comments: z.array(SummaryCommentItemSchema),
  praises: z.array(SummaryPraiseItemSchema),
});

export const SummaryAssignmentSchema = z.object({
  assignment_id: z.string(),
  title: z.string(),
  start_date: z.string().datetime(),
  due_date: z.string().datetime(),
  allow_multiple_submissions: z.enum(["Y", "N"]),
  active: z.enum(["Y", "N"]),
  linked_team_ids: z.array(z.string()),
  submissions: z.array(SummarySubmissionSchema),
});

export const SummaryTeamSchema = z.object({
  team_id: z.string(),
  team_number: z.string(),
  members: z.array(SummaryUserSchema),
});

export const SummaryClassSchema = z.object({
  class_id: z.string(),
  name: z.string(),
  section: z.string(),
  term: z.string(),
  year: z.number().int(),
  teams: z.array(SummaryTeamSchema),
  assignments: z.array(SummaryAssignmentSchema),
});

export const InstructorSummaryInstructorSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.literal("instructor"),
});

export const InstructorSummaryResponseSchema = z.object({
  ok: z.literal(true),
  instructor: InstructorSummaryInstructorSchema,
  classes: z.array(SummaryClassSchema),
});

export type InstructorSummaryResponse = z.infer<
  typeof InstructorSummaryResponseSchema
>;

// ---- Responses: Instructor Summary Lite (GET /api/responses/instructor-summary-lite) ----

export const LiteInstructorSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  first_name: z.string().nullable().optional().default(""),
  last_name: z.string().nullable().optional().default(""),
  role: z.enum(["instructor", "ta"]),
});

export const LiteMemberSchema = z.object({
  user_id: z.string(),
  email: z.string().email().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  role: z.enum(["student", "instructor", "ta"]).nullable().optional(),
});

export const LiteTeamSchema = z.object({
  team_id: z.string(),
  team_number: z.string(),
  members_count: z.number().int(),
  members: z.array(LiteMemberSchema),
});

export const LiteClassSchema = z.object({
  class_id: z.string(),
  name: z.string().nullable().optional(),
  section: z.string().nullable().optional(),
  term: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  teams: z.array(LiteTeamSchema),
});

export const InstructorSummaryLiteResponseSchema = z.object({
  ok: z.literal(true),
  instructor: LiteInstructorSchema,
  classes: z.array(LiteClassSchema),
});

export type InstructorSummaryLiteResponse = z.infer<
  typeof InstructorSummaryLiteResponseSchema
>;
export type LiteInstructor = z.infer<typeof LiteInstructorSchema>;
export type LiteMember = z.infer<typeof LiteMemberSchema>;
export type LiteTeam = z.infer<typeof LiteTeamSchema>;
export type LiteClass = z.infer<typeof LiteClassSchema>;


// ---- Responses: Group Assignments (GET /api/responses/group-assignments) ----

export const GroupAssignmentsClassSchema = z.object({
  class_id: z.string(),
  name: z.string().nullable().optional(),
  section: z.string().nullable().optional(),
  term: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
});

export const GroupAssignmentsMemberSchema = z.object({
  user_id: z.string(),
  email: z.string().email().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
});

export const GroupAssignmentsTeamSchema = z.object({
  team_id: z.string(),
  team_number: z.string(),
  members: z.array(GroupAssignmentsMemberSchema),
});

const YnOrBool = z.union([z.enum(["Y", "N"]), z.boolean()]);

export const GroupAssignmentItemSchema = z.object({
  assignment_id: z.string(),
  title: z.string().nullable().optional(),
  start_date: z.string().datetime(), // Date -> ISO string
  due_date: z.string().datetime(),
  active: YnOrBool,
  allow_multiple_submissions: YnOrBool,
  submissionsCount: z.number().int(),
});

export const GroupAssignmentsResponseSchema = z.object({
  ok: z.literal(true),
  class: GroupAssignmentsClassSchema,
  team: GroupAssignmentsTeamSchema,
  assignments: z.array(GroupAssignmentItemSchema),
});

export type GroupAssignmentsResponse = z.infer<
  typeof GroupAssignmentsResponseSchema
>;

// ---- Responses: Assignment Detail (GET /api/responses/assignment-detail) ----

export const AssignmentDetailQuestionInfoSchema = z.object({
  question_id: z.string().nullable(),
  qid: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
});

export const AssignmentDetailResponseItemSchema = z.object({
  response_id: z.string(),
  from_student_id: z.string(),
  to_student_id: z.string(),
  question_id: z.string(),
  question: AssignmentDetailQuestionInfoSchema,
  rating: z.number().int().nullable().optional(),
});

export const AssignmentDetailCommentItemSchema = z.object({
  comment_id: z.string(),
  from_student_id: z.string(),
  to_student_id: z.string(),
  question_id: z.string(),
  question: AssignmentDetailQuestionInfoSchema,
  comment_text: z.string().nullable().optional(),
});

export const AssignmentDetailPraiseItemSchema = z.object({
  praise_id: z.string(),
  from_student_id: z.string(),
  to_student_id: z.string(),
  question_id: z.string().nullable(),
  question: AssignmentDetailQuestionInfoSchema.nullable(),
  praise_text: z.string().nullable().optional(),
});

export const AssignmentDetailSubmissionSchema = z.object({
  submission_id: z.string(),
  from_student_id: z.string(),
  submitted_at: z.union([z.string().datetime(), z.string().nullable()]),
  single_lock: z.string().nullable().optional(),
  responses: z.array(AssignmentDetailResponseItemSchema),
  comments: z.array(AssignmentDetailCommentItemSchema),
  praises: z.array(AssignmentDetailPraiseItemSchema),
});

export const AssignmentDetailTeamSchema = z.object({
  team_id: z.string(),
  team_number: z.string(),
  members: z.array(GroupAssignmentsMemberSchema), // same shape is fine
});

export const AssignmentDetailAssignmentSchema = z.object({
  assignment_id: z.string(),
  title: z.string().nullable().optional(),
  start_date: z.string().datetime(),
  due_date: z.string().datetime(),
  active: YnOrBool,
  allow_multiple_submissions: YnOrBool,
});

export const AssignmentDetailResponseSchema = z.object({
  ok: z.literal(true),
  assignment: AssignmentDetailAssignmentSchema,
  team: AssignmentDetailTeamSchema,
  submissions: z.array(AssignmentDetailSubmissionSchema),
});

export type AssignmentDetailResponse = z.infer<
  typeof AssignmentDetailResponseSchema
>;

export type AssignmentDetailTeam = z.infer<typeof AssignmentDetailTeamSchema>;
export type AssignmentDetailSubmission = z.infer<
  typeof AssignmentDetailSubmissionSchema
>;
export type AssignmentTeamMember = z.infer<typeof GroupAssignmentsMemberSchema>;
