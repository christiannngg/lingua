export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type AssessmentResult = {
  cefrLevel: string;
  cefrDescription: string;
};

export type SelfReportBand = "A1" | "A2" | "B1" | "C1";