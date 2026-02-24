// peerinsights/app/responses/types.ts

export type Role = "instructor" | "student" | "ta" | string;

export type Instructor = {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
};

export type Member = {
  user_id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: Role | null;
};

export type Team = {
  team_id: string;
  team_number: string; // e.g., "Group Alpha"
  members: Member[];
};

export type ResponseItem = {
  response_id: string;
  from_student_id: string;
  to_student_id: string;
  question_id: string;
  rating?: number; // present for rating responses
};

export type CommentItem = {
  comment_id: string;
  from_student_id: string;
  to_student_id: string;
  question_id: string;
  comment_text: string;
};

export type PraiseItem = {
  praise_id: string;
  from_student_id: string;
  to_student_id: string;
  question_id: string;
  praise_text: string;
};

export type Submission = {
  submission_id: string;
  assignment_id: string;
  team_id: string;
  from_student_id: string;
  submitted_at: string; // ISO date
  single_lock: string;  // e.g., "S"
  responses: ResponseItem[];
  comments: CommentItem[];
  praises: PraiseItem[];
};

export type Assignment = {
  assignment_id: string;
  title: string;
  start_date: string; // ISO date
  due_date: string;   // ISO date
  allow_multiple_submissions: "Y" | "N" | string;
  active: "Y" | "N" | string;
  linked_team_ids: string[];
  submissions: Submission[];
};

export type ClassItem = {
  class_id: string;
  name: string;
  section: string;
  term: string;
  year: number;
  teams: Team[];
  assignments: Assignment[];
};

export type InstructorSummaryResponse = {
  ok: boolean;
  instructor: Instructor;
  classes: ClassItem[];
};

export type GroupCardProps = {
  courseName: string;
  section: string;
  teamId: string;
  teamName: string;
  members: Member[];
  // Added for navigation
  classId: string;
    instructorEmail: string; 
};

export type GroupCardModel = {
  classId: string;
  className: string;
  section: string;
  term: string;
  year: number;
  teamId: string;
  teamName: string;
  members: Team["members"];
};