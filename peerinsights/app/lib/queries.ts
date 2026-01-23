// peerinsights/app/lib/queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFormMeta, submitEvaluation } from "./formApi";
import {
  FormRequest,
  FormResponse,
  SubmissionPayload,
  SubmitResponse,
  CreateClassRequest,
  CreateClassResponse,
  UpdateTeamsRequest,
  UpdateTeamsResponse,
  CreateAssignmentRequest,
  CreateAssignmentResponse,
  UpdateAssignmentRequest,
  UpdateAssignmentResponse,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  InstructorSummaryResponse,
  InstructorSummaryLiteResponse,
  GroupAssignmentsResponse,
  AssignmentDetailResponse,
} from "./zodSchemas";
import { createClass, fetchClassesByInstructor, fetchClassDetails, updateClassTeams } from "./classesApi";
import {
  createAssignment,
  fetchAssignmentsByClass,
  updateAssignment,
} from "./assignmentsApi";
import { registerUser, loginUser } from "./authApi";
import { fetchInstructorSummary,
  fetchInstructorSummaryLite,
  fetchGroupAssignments,
  fetchAssignmentDetail, } from "./responsesApi";

// GET /api/form
export function useFormMetaQuery(req: FormRequest | null, enabled = true) {
  return useQuery<FormResponse, Error>({
    queryKey: ["form-meta", req?.student_email, req?.team_number],
    queryFn: ({ signal }) => {
      if (!req) throw new Error("Missing request");
      return fetchFormMeta(req, { signal });
    },
    enabled: !!req && enabled, // do not run until both fields present
  });
}


// POST /api/submit
export function useSubmitEvaluation() {
  const qc = useQueryClient();
  return useMutation<SubmitResponse, Error, SubmissionPayload>({
    mutationFn: (payload) => submitEvaluation(payload),
    onSuccess: () => {
      // invalidate if your UI shows "submission status"
      qc.invalidateQueries({ queryKey: ["form-meta"] });
    },
  });
}

// Classes and Teams
// Create class
export function useCreateClass() {
  return useMutation<CreateClassResponse, Error, CreateClassRequest>({
    mutationFn: (payload) => createClass(payload),
  });
}


// Fetch classes by instructor email
export function useClassesByInstructor(email: string | null) {
  return useQuery({
    queryKey: ["classes-by-instructor", email],
    enabled: !!email,
    queryFn: ({ signal }) => {
      if (!email) throw new Error("Missing instructor email");
      return fetchClassesByInstructor(email, { signal });
    },
  });
}

// Fetch class details by instructor email and section
export function useClassDetails(instructorEmail: string | null, section: string | null) {
  return useQuery({
    queryKey: ["class-details", instructorEmail, section],
    enabled: !!instructorEmail && !!section,
    queryFn: ({ signal }) => {
      if (!instructorEmail || !section) throw new Error("Missing params");
      return fetchClassDetails(instructorEmail, section, { signal });
    },
  });
}

// Update teams
export function useUpdateTeams() {
  return useMutation<UpdateTeamsResponse, Error, UpdateTeamsRequest>({
    mutationFn: (payload) => updateClassTeams(payload),
  });
}

// ---------- Assignments ----------
// Create Assignment
export function useCreateAssignment() {
  return useMutation<CreateAssignmentResponse, Error, CreateAssignmentRequest>({
    mutationFn: (payload) => createAssignment(payload),
  });
}

// List Assignments by Class
export function useAssignments(instructorEmail: string | null, section: string | null) {
  return useQuery({
    queryKey: ["assignments-by-class", instructorEmail, section],
    enabled: !!instructorEmail && !!section,
    queryFn: ({ signal }) => {
      if (!instructorEmail || !section) throw new Error("Missing params");
      return fetchAssignmentsByClass(instructorEmail, section, { signal });
    },
  });
}

// Update Assignment
export function useUpdateAssignment() {
  return useMutation<UpdateAssignmentResponse, Error, UpdateAssignmentRequest>({
    mutationFn: (payload) => updateAssignment(payload),
  });
}

// ---------- Auth ----------

// Register instructor / TA
export function useRegisterUser() {
  return useMutation<RegisterResponse, Error, RegisterRequest>({
    mutationFn: (payload) => registerUser(payload),
  });
}

// Login (student / instructor / TA)
export function useLoginUser() {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (payload) => loginUser(payload),
  });
}

// ---------- Responses API ----------
// whole Instructor Summary
export function useInstructorSummary(instructorEmail: string | null) {
  return useQuery<InstructorSummaryResponse, Error>({
    queryKey: ["instructor-summary", instructorEmail],
    enabled: !!instructorEmail,
    queryFn: ({ signal }) => {
      if (!instructorEmail) throw new Error("Missing instructor email");
      return fetchInstructorSummary(instructorEmail, { signal });
    },
  });
}

// lite Instructor Summary
export function useInstructorSummaryLite(instructorEmail: string | null) {
  return useQuery<InstructorSummaryLiteResponse, Error>({
    queryKey: ["instructor-summary-lite", instructorEmail],
    enabled: !!instructorEmail,
    queryFn: ({ signal }) => {
      if (!instructorEmail) throw new Error("Missing instructor email");
      return fetchInstructorSummaryLite(instructorEmail, { signal });
    },
  });
}

// Group Assignments
export function useGroupAssignments(classId: string | null, teamId: string | null) {
  return useQuery<GroupAssignmentsResponse, Error>({
    queryKey: ["group-assignments", classId, teamId],
    enabled: !!classId && !!teamId,
    queryFn: ({ signal }) => {
      if (!classId || !teamId) throw new Error("Missing params");
      return fetchGroupAssignments(classId, teamId, { signal });
    },
  });
}

// Assignment Detail
export function useAssignmentDetail(assignmentId: string | null, teamId: string | null) {
  return useQuery<AssignmentDetailResponse, Error>({
    queryKey: ["assignment-detail", assignmentId, teamId],
    enabled: !!assignmentId && !!teamId,
    queryFn: ({ signal }) => {
      if (!assignmentId || !teamId) throw new Error("Missing params");
      return fetchAssignmentDetail(assignmentId, teamId, { signal });
    },
  });
}
