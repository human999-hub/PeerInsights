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
} from "./zodSchemas";
import { createClass, fetchClassesByInstructor, fetchClassDetails, updateClassTeams } from "./classesApi";
import {
  createAssignment,
  fetchAssignmentsByClass,
} from "./assignmentsApi";

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
export function useCreateClass() {
  return useMutation<CreateClassResponse, Error, CreateClassRequest>({
    mutationFn: (payload) => createClass(payload),
  });
}


// Fetch classes by instructor
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

// Assignments
export function useCreateAssignment() {
  return useMutation<CreateAssignmentResponse, Error, CreateAssignmentRequest>({
    mutationFn: (payload) => createAssignment(payload),
  });
}

// (Optional for later list page)
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