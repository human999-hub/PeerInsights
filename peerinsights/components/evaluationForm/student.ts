// components/evaluationForm/student.ts
export const groupOptions = [1, 2, 3, 4, 5];

export interface StudentInfo {
  firstName: string;
  lastName: string;
  groupId: number | "";
}

export const initialStudentInfo: StudentInfo = {
  firstName: "",
  lastName: "",
  groupId: "",
};
