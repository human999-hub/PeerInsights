// components/evaluationForm/StudentInfoForm.tsx
import React from "react";
import { groupOptions } from "./student";

type Props = {
  firstName: string;
  lastName: string;
  email: string;
  groupId: number | "";
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setEmail: (v: string) => void;
  setGroupId: (v: number | "") => void;
};

export default function StudentInfoForm({
  firstName,
  lastName,
  email,
  groupId,
  setFirstName,
  setLastName,
  setEmail,
  setGroupId,
}: Props) {
  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Student Information
      </h2>
      <div>
        <label className="block text-gray-700 mb-1">
          First Name (as listed on Canvas)
        </label>
        <input
          type="text"
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-1">
          Last Name (as listed on Canvas)
        </label>
        <input
          type="text"
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-1">Email</label>
        <input
          type="email"
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="haritha@example.com"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Used only to look up your evaluation.
        </p>
      </div>
      <div>
        <label className="block text-gray-700 mb-1">
          What is your group number?
        </label>
        <select
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#861f41]"
          value={groupId}
          onChange={(e) =>
            setGroupId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">Select Group Number</option>
          {groupOptions.map((num) => (
            <option key={num} value={num}>
              Group {num}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}