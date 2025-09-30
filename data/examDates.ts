export interface ExamInfo {
  name: string;
  examDate: string; // YYYY-MM-DD
  applicationStartDate: string; // YYYY-MM-DD
  applicationEndDate: string; // YYYY-MM-DD
}

// NOTE: This list should be periodically updated with official ÖSYM dates.
export const ydsExamDates: ExamInfo[] = [
  {
    name: "YDS/2 2024",
    examDate: "2024-10-27",
    applicationStartDate: "2024-08-20",
    applicationEndDate: "2024-08-28",
  },
  {
    name: "YDS/1 2025",
    examDate: "2025-04-06",
    applicationStartDate: "2025-02-12",
    applicationEndDate: "2025-02-19",
  },
  {
    name: "YDS/2 2025",
    examDate: "2025-10-26",
    applicationStartDate: "2025-08-19",
    applicationEndDate: "2025-08-27",
  },
  {
    name: "YDS/1 2026",
    examDate: "2026-04-05",
    applicationStartDate: "2026-02-11",
    applicationEndDate: "2026-02-18",
  }
];
