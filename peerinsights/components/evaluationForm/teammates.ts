// components/evaluationForm/teammates.ts
export interface Teammate {
  id: string;
  name: string;
  isSelf: boolean;
}

export const teammates: Teammate[] = [
  { id: "tm1", name: "Teammate 1 (You)", isSelf: true },
  { id: "tm2", name: "Teammate 2", isSelf: false },
  { id: "tm3", name: "Teammate 3", isSelf: false },
  { id: "tm4", name: "Teammate 4", isSelf: false },
];
