"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFormMeta, submitEvaluation } from "./formApi";
import { FormRequest, FormResponse, SubmissionPayload, SubmitResponse } from "./zodSchemas";

export function useFormMetaQuery(req: FormRequest | null) {
  return useQuery<FormResponse, Error>({
    queryKey: ["form-meta", req?.student_email, req?.team_number],
    queryFn: ({ signal }) => {
      if (!req) throw new Error("Missing request");
      return fetchFormMeta(req, { signal });
    },
    enabled: !!req, // do not run until both fields present
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
