// components/evaluationForm/LookupForm.tsx
"use client";

import { groupOptions } from "./student";

type Props = {
  email: string;
  groupId: number | "";
  setEmail: (v: string) => void;
  setGroupId: (v: number | "") => void;
  onNext: () => void;
  loading?: boolean;
  errorMessage?: string;
};

export default function LookupForm({
  email,
  groupId,
  setEmail,
  setGroupId,
  onNext,
  loading = false,
  errorMessage = "",
}: Props) {
//   const canContinue = !!email && !!groupId;
  return (
    <div className="space-y-6 mt-4 bg-light-maroon mb-8 p-6">
      <h2 className="text-xl font-semibold text-primary mb-2">
        Submit your details
      </h2>
      <div>
        <label className="block text-gray-700 mb-1">Email address</label>
        <input
          className="w-full bg-white/30 border border-subtle-maroon-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sam@example.com"
          required
        />

        <label className="mt-4 block text-gray-700 mb-1">Team Number</label>
        <select
          value={groupId}
          // bg-subtle-maroon/20
          className="w-full  bg-white/30 border border-subtle-maroon-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => {
            setGroupId(e.target.value ? Number(e.target.value) : "");
          }}
        >
          <option className="bg-white/30" value="">
            Select your team number
          </option>
          {groupOptions.map((num) => (
            <option className="bg-subtle-maroon/30" key={num} value={num}>
              Group {num}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end">
        <button
          className="button-primary disabled:opacity-50"
          type="button"
          disabled={loading}
          onClick={onNext}
        >
          {loading ? "Loading.." : "Next"}
        </button>
      </div>
      {errorMessage && (
        <p className="mt-6 text-center text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
