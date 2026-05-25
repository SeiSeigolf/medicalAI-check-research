export type Condition = "control" | "evidence" | "audit";

export type SessionStatus = "created" | "in_progress" | "completed" | "withdrawn";

export type AssignmentStatus = "not_started" | "in_progress" | "submitted";

export type ErrorType =
  | "no_problem"
  | "unsupported"
  | "contradicted"
  | "omission"
  | "unsafe_recommendation"
  | "wrong_dosage"
  | "missing_red_flag"
  | "overgeneralization"
  | "privacy_risk"
  | "unclear_expression"
  | "other";

export interface ParticipantProfile {
  role: "medical_student" | "resident" | "physician" | "nurse" | "pharmacist" | "care_manager" | "other";
  gradeOrYear?: string;
  clinicalExperienceYears?: number;
  aiUsageFrequency: "never" | "rarely" | "monthly" | "weekly" | "daily";
  priorMedicalAIUse: "none" | "education" | "research" | "clinical" | "other";
  selfRatedMedicalKnowledge?: 1 | 2 | 3 | 4 | 5;
  consent: true;
  experimentVersion: string;
}

export interface Assignment {
  assignmentId: string;
  sessionId: string;
  participantId: string;
  caseId: string;
  condition: Condition;
  order: number;
  status: AssignmentStatus;
  isTutorial: boolean;
  startedAt?: FirebaseFirestore.Timestamp;
  submittedAt?: FirebaseFirestore.Timestamp;
}

export interface GroundTruthError {
  errorId: string;
  caseId: string;
  aiOutputId: string;
  claimId?: string;
  errorType: Exclude<ErrorType, "no_problem" | "other">;
  severity: 1 | 2 | 3 | 4 | 5;
  explanation: string;
  expectedCorrection: string;
  expertReviewerIds: string[];
  consensusStatus: "draft" | "reviewed" | "consensus";
}

export interface SelectedErrorInput {
  claimId: string;
  selectedErrorType: ErrorType;
  selectedSeverity?: number;
  reasonText?: string;
  correctionText?: string;
  confidenceInSelection?: number;
}

export interface SubmitCaseAnswerInput {
  assignmentId: string;
  participantId: string;
  sessionId: string;
  caseId: string;
  condition: Condition;
  selectedErrors: SelectedErrorInput[];
  trustScore: number;
  confidenceScore: number;
  finalUseDecision: number;
  needsAdditionalCheck: boolean;
  perceivedDifficulty: number;
  workloadScore: number;
  freeTextComment?: string;
  startedAt: string;
  submittedAt: string;
  checklistCheckedItems?: string[];
}

export interface UIEventInput {
  assignmentId?: string;
  caseId?: string;
  condition?: Condition;
  eventType: string;
  targetType?: "claim" | "evidence" | "checklist" | "button" | "page";
  targetId?: string;
  timestamp: string;
  elapsedMs?: number;
  payload?: Record<string, unknown>;
}
