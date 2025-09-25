// peerinsights/app/lib/queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFormMeta, submitEvaluation } from "./formApi";
import { FormRequest, FormResponse, SubmissionPayload, SubmitResponse, CreateClassRequest, CreateClassResponse } from "./zodSchemas";
import { createClass } from "./classesApi";

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

export function useCreateClass() {
  return useMutation<CreateClassResponse, Error, CreateClassRequest>({
    mutationFn: (payload) => createClass(payload),
  });
}