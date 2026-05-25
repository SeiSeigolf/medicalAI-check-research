import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { onRequest } from "firebase-functions/v2/https";
import type { Assignment, Condition, GroundTruthError, ParticipantProfile, SubmitCaseAnswerInput, UIEventInput } from "./types.js";
import {
  experimentId,
  seedAiOutputs,
  seedAnnotations,
  seedCases,
  seedClaims,
  seedExperiment,
  seedGroundTruthErrors,
  seedSafetyChecklists,
} from "./seedData.js";

initializeApp();

const db = getFirestore();
const region = "asia-northeast1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

type HttpRequest = {
  method: string;
  query: Record<string, unknown>;
  body: unknown;
  headers: { authorization?: string };
};

type HttpResponse = {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => HttpResponse;
  send: (value: unknown) => void;
  json: (value: unknown) => void;
};

type HttpHandler = (req: HttpRequest, res: HttpResponse) => Promise<void> | void;

function makeHttps(handler: HttpHandler) {
  return onRequest({ region, cors: true }, async (req, res) => {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    await handler(req as HttpRequest, res as HttpResponse);
  });
}

function body<T>(req: { body: unknown }): T {
  return typeof req.body === "string" ? JSON.parse(req.body) as T : req.body as T;
}

async function requireUser(req: { headers: { authorization?: string } }) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) throw httpError(401, "Missing Firebase ID token.");
  return getAuth().verifyIdToken(token);
}

async function requireAdmin(req: { headers: { authorization?: string } }) {
  const user = await requireUser(req);
  const doc = await db.collection("admin_users").doc(user.uid).get();
  if (!doc.exists) throw httpError(403, "Admin permission required.");
  return user;
}

function httpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function handleError(res: { status: (code: number) => { json: (value: unknown) => void } }, error: unknown) {
  const typed = error as Error & { status?: number };
  res.status(typed.status ?? 500).json({ error: typed.message ?? "Internal server error" });
}

function parseIso(value: string) {
  const millis = Date.parse(value);
  if (Number.isNaN(millis)) throw httpError(400, `Invalid ISO timestamp: ${value}`);
  return Timestamp.fromMillis(millis);
}

function docId(prefix: string) {
  return `${prefix}_${db.collection("_ids").doc().id}`;
}

export const createParticipant = makeHttps(async (req, res) => {
  try {
    if (req.method !== "POST") throw httpError(405, "POST required.");
    const user = await requireUser(req);
    const input = body<ParticipantProfile>(req);
    if (input.consent !== true) throw httpError(400, "consent: true is required.");

    const sessionId = docId("session");
    await db.runTransaction(async (tx) => {
      tx.create(db.collection("participants").doc(user.uid), {
        participantId: user.uid,
        ...input,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.create(db.collection("sessions").doc(sessionId), {
        sessionId,
        participantId: user.uid,
        status: "created",
        experimentVersion: input.experimentVersion,
        assignedConditionPattern: "",
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    res.json({ participantId: user.uid, sessionId });
  } catch (error) {
    handleError(res, error);
  }
});

export const assignExperimentSession = makeHttps(async (req, res) => {
  try {
    if (req.method !== "POST") throw httpError(405, "POST required.");
    const user = await requireUser(req);
    const input = body<{ participantId: string; sessionId: string }>(req);
    if (input.participantId !== user.uid) throw httpError(403, "participantId mismatch.");

    const assignedCases = await db.runTransaction(async (tx) => {
      const existing = await tx.get(db.collection("case_assignments").where("sessionId", "==", input.sessionId).orderBy("order"));
      if (!existing.empty) {
        return existing.docs.map((doc) => pickAssignmentResponse(doc.data() as Assignment));
      }

      const experimentSnap = await tx.get(db.collection("experiments").where("status", "==", "active").limit(1));
      if (experimentSnap.empty) throw httpError(400, "No active experiment.");
      const experiment = experimentSnap.docs[0].data() as { caseIds: string[]; conditions: Condition[]; version: string };
      const assignments = buildLatinSquareAssignments(input.participantId, input.sessionId, experiment.caseIds, experiment.conditions);

      for (const assignment of assignments) {
        tx.create(db.collection("case_assignments").doc(assignment.assignmentId), assignment);
      }
      tx.update(db.collection("sessions").doc(input.sessionId), {
        status: "in_progress",
        experimentVersion: experiment.version,
        assignedConditionPattern: assignments.map((item) => item.condition).join("-"),
        startedAt: FieldValue.serverTimestamp(),
      });
      return assignments.map(pickAssignmentResponse);
    });

    res.json({ sessionId: input.sessionId, assignedCases });
  } catch (error) {
    handleError(res, error);
  }
});

export const getCaseForReview = makeHttps(async (req, res) => {
  try {
    if (req.method !== "GET") throw httpError(405, "GET required.");
    const user = await requireUser(req);
    const assignmentId = String(req.query.assignmentId ?? "");
    const participantId = String(req.query.participantId ?? "");
    if (!assignmentId || !participantId) throw httpError(400, "assignmentId and participantId are required.");
    if (participantId !== user.uid) throw httpError(403, "participantId mismatch.");

    const assignmentRef = db.collection("case_assignments").doc(assignmentId);
    const assignmentSnap = await assignmentRef.get();
    if (!assignmentSnap.exists) throw httpError(404, "assignment not found.");
    const assignment = assignmentSnap.data() as Assignment;
    if (assignment.participantId !== user.uid) throw httpError(403, "assignment permission denied.");

    const [caseSnap, aiOutputSnap, claimsSnap, assignmentsSnap] = await Promise.all([
      db.collection("cases").doc(assignment.caseId).get(),
      db.collection("ai_outputs").where("caseId", "==", assignment.caseId).where("isActive", "==", true).limit(1).get(),
      db.collection("claims").where("caseId", "==", assignment.caseId).orderBy("order").get(),
      db.collection("case_assignments").where("sessionId", "==", assignment.sessionId).get(),
    ]);

    if (!caseSnap.exists) throw httpError(404, "case not found.");
    if (aiOutputSnap.empty) throw httpError(404, "active ai output not found.");
    const aiOutput = aiOutputSnap.docs[0].data();
    const claims = claimsSnap.docs.map((doc) => doc.data());
    const claimIds = claims.map((claim) => claim.claimId as string);
    const annotations = assignment.condition === "control"
      ? new Map<string, unknown>()
      : await annotationMap(claimIds);
    const checklist = assignment.condition === "audit"
      ? await safetyChecklist(assignment.caseId)
      : undefined;

    if (assignment.status === "not_started") {
      await assignmentRef.update({ status: "in_progress", startedAt: FieldValue.serverTimestamp() });
    }

    res.json({
      assignmentId,
      condition: assignment.condition,
      order: assignment.order,
      totalAssignments: assignmentsSnap.size,
      case: caseSnap.data(),
      aiOutput,
      claims: claims.map((claim) => ({
        claimId: claim.claimId,
        order: claim.order,
        text: claim.text,
        claimType: claim.claimType,
        auditAnnotation: annotations.get(claim.claimId),
      })),
      safetyChecklist: checklist,
    });
  } catch (error) {
    handleError(res, error);
  }
});

export const getNextAssignment = makeHttps(async (req, res) => {
  try {
    if (req.method !== "GET") throw httpError(405, "GET required.");
    const user = await requireUser(req);
    const participantId = String(req.query.participantId ?? "");
    const sessionId = String(req.query.sessionId ?? "");
    if (participantId !== user.uid) throw httpError(403, "participantId mismatch.");

    const snap = await db.collection("case_assignments")
      .where("sessionId", "==", sessionId)
      .where("status", "in", ["not_started", "in_progress"])
      .orderBy("order")
      .limit(1)
      .get();

    if (snap.empty) {
      await db.collection("sessions").doc(sessionId).update({
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
      });
      res.json({ nextAssignmentId: null, isCompleted: true });
      return;
    }

    res.json({ nextAssignmentId: snap.docs[0].id, isCompleted: false });
  } catch (error) {
    handleError(res, error);
  }
});

export const submitCaseAnswer = makeHttps(async (req, res) => {
  try {
    if (req.method !== "POST") throw httpError(405, "POST required.");
    const user = await requireUser(req);
    const input = body<SubmitCaseAnswerInput>(req);
    if (input.participantId !== user.uid) throw httpError(403, "participantId mismatch.");

    const answerId = docId("answer");
    const selectedErrors = await db.runTransaction(async (tx) => {
      const assignmentRef = db.collection("case_assignments").doc(input.assignmentId);
      const assignmentSnap = await tx.get(assignmentRef);
      if (!assignmentSnap.exists) throw httpError(404, "assignment not found.");
      const assignment = assignmentSnap.data() as Assignment;
      if (assignment.participantId !== user.uid) throw httpError(403, "assignment permission denied.");
      if (assignment.status === "submitted") throw httpError(409, "assignment already submitted.");

      const existing = await tx.get(db.collection("case_answers").where("assignmentId", "==", input.assignmentId).limit(1));
      if (!existing.empty) throw httpError(409, "case answer already exists.");

      const groundTruthSnap = await tx.get(db.collection("ground_truth_errors").where("caseId", "==", input.caseId));
      const groundTruth = groundTruthSnap.docs.map((doc) => doc.data() as GroundTruthError);
      const selectedRows = input.selectedErrors.map((selected) => {
        const matched = groundTruth.find((truth) => truth.claimId === selected.claimId);
        return {
          selectedErrorId: docId("selected_error"),
          answerId,
          participantId: input.participantId,
          sessionId: input.sessionId,
          caseId: input.caseId,
          claimId: selected.claimId,
          condition: input.condition,
          isTutorial: false,
          selectedErrorType: selected.selectedErrorType,
          selectedSeverity: selected.selectedSeverity ?? null,
          reasonText: selected.reasonText ?? "",
          correctionText: selected.correctionText ?? "",
          confidenceInSelection: selected.confidenceInSelection ?? null,
          isTruePositive: Boolean(matched && selected.selectedErrorType !== "no_problem"),
          matchedGroundTruthErrorId: matched?.errorId ?? null,
        };
      });

      const startedAt = parseIso(input.startedAt);
      const submittedAt = parseIso(input.submittedAt);
      tx.create(db.collection("case_answers").doc(answerId), {
        answerId,
        assignmentId: input.assignmentId,
        participantId: input.participantId,
        sessionId: input.sessionId,
        caseId: input.caseId,
        condition: input.condition,
        isTutorial: false,
        startedAt,
        submittedAt,
        durationMs: submittedAt.toMillis() - startedAt.toMillis(),
        trustScore: input.trustScore,
        confidenceScore: input.confidenceScore,
        finalUseDecision: input.finalUseDecision,
        needsAdditionalCheck: input.needsAdditionalCheck,
        perceivedDifficulty: input.perceivedDifficulty,
        workloadScore: input.workloadScore,
        freeTextComment: input.freeTextComment ?? "",
        checklistCheckedItems: input.checklistCheckedItems ?? [],
      });

      for (const row of selectedRows) {
        tx.create(db.collection("selected_error_answers").doc(row.selectedErrorId), row);
      }
      tx.update(assignmentRef, { status: "submitted", submittedAt });
      return selectedRows;
    });

    res.json({ answerId, selectedErrors });
  } catch (error) {
    handleError(res, error);
  }
});

export const logUIEvents = makeHttps(async (req, res) => {
  try {
    if (req.method !== "POST") throw httpError(405, "POST required.");
    const user = await requireUser(req);
    const input = body<{ participantId: string; sessionId: string; events: UIEventInput[] }>(req);
    if (input.participantId !== user.uid) throw httpError(403, "participantId mismatch.");
    if (!Array.isArray(input.events) || input.events.length > 50) throw httpError(400, "events must be an array of up to 50 items.");

    const batch = db.batch();
    for (const event of input.events) {
      const eventId = docId("event");
      batch.create(db.collection("ui_events").doc(eventId), {
        eventId,
        participantId: input.participantId,
        sessionId: input.sessionId,
        assignmentId: event.assignmentId ?? null,
        caseId: event.caseId ?? null,
        condition: event.condition ?? null,
        eventType: event.eventType,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        timestamp: parseIso(event.timestamp),
        elapsedMs: event.elapsedMs ?? null,
        payload: event.payload ?? {},
      });
    }
    await batch.commit();
    res.json({ saved: input.events.length });
  } catch (error) {
    handleError(res, error);
  }
});

export const submitQuestionnaire = makeHttps(async (req, res) => {
  try {
    if (req.method !== "POST") throw httpError(405, "POST required.");
    const user = await requireUser(req);
    const input = body<Record<string, unknown> & { participantId: string; sessionId: string }>(req);
    if (input.participantId !== user.uid) throw httpError(403, "participantId mismatch.");
    const questionnaireId = docId("questionnaire");
    await db.collection("questionnaires").doc(questionnaireId).create({
      questionnaireId,
      ...input,
      submittedAt: FieldValue.serverTimestamp(),
    });
    res.json({ questionnaireId });
  } catch (error) {
    handleError(res, error);
  }
});

export const adminGetParticipants = makeHttps(async (req, res) => {
  try {
    if (req.method !== "GET") throw httpError(405, "GET required.");
    await requireAdmin(req);
    const [participants, sessions, answers] = await Promise.all([
      db.collection("participants").orderBy("createdAt", "desc").limit(200).get(),
      db.collection("sessions").orderBy("createdAt", "desc").limit(200).get(),
      db.collection("case_answers").orderBy("submittedAt", "desc").limit(500).get(),
    ]);
    res.json({
      participants: participants.docs.map((doc) => doc.data()),
      sessions: sessions.docs.map((doc) => doc.data()),
      answers: answers.docs.map((doc) => doc.data()),
    });
  } catch (error) {
    handleError(res, error);
  }
});

export const exportStudyData = makeHttps(async (req, res) => {
  try {
    if (req.method !== "POST") throw httpError(405, "POST required.");
    await requireAdmin(req);
    const input = body<{ exportType: "csv" | "json"; tables: string[]; experimentVersion?: string }>(req);
    const exportId = docId("export");
    const result: Record<string, unknown[]> = {};
    for (const table of input.tables) {
      const snap = await db.collection(table).limit(5000).get();
      result[table] = snap.docs.map((doc) => doc.data());
    }
    await db.collection("exports").doc(exportId).create({
      exportId,
      exportType: input.exportType,
      tables: input.tables,
      experimentVersion: input.experimentVersion ?? null,
      status: "completed",
      createdAt: FieldValue.serverTimestamp(),
      rowCounts: Object.fromEntries(Object.entries(result).map(([table, rows]) => [table, rows.length])),
    });
    res.json({ exportId, data: result });
  } catch (error) {
    handleError(res, error);
  }
});

export const seedDemoData = makeHttps(async (req, res) => {
  try {
    if (req.method !== "POST") throw httpError(405, "POST required.");
    await requireAdmin(req);
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();
    for (const item of seedCases) batch.set(db.collection("cases").doc(item.caseId), { ...item, createdAt: now, updatedAt: now, createdBy: "seed" });
    for (const item of seedAiOutputs) batch.set(db.collection("ai_outputs").doc(item.aiOutputId), { ...item, createdAt: now, generatedAt: now });
    for (const item of seedClaims) batch.set(db.collection("claims").doc(item.claimId), { ...item, createdAt: now });
    for (const item of seedAnnotations) batch.set(db.collection("audit_annotations").doc(item.annotationId), { ...item, createdAt: now, updatedAt: now, createdBy: "seed" });
    for (const item of seedGroundTruthErrors) batch.set(db.collection("ground_truth_errors").doc(item.errorId), { ...item, createdAt: now, updatedAt: now, createdBy: "seed" });
    for (const item of seedSafetyChecklists) batch.set(db.collection("safety_checklists").doc(item.checklistId), { ...item, createdAt: now, updatedAt: now, createdBy: "seed" });
    batch.set(db.collection("experiments").doc(experimentId), { ...seedExperiment, createdAt: now, activatedAt: now, createdBy: "seed" });
    await batch.commit();
    res.json({ seeded: true, experimentId });
  } catch (error) {
    handleError(res, error);
  }
});

function buildLatinSquareAssignments(participantId: string, sessionId: string, caseIds: string[], conditions: Condition[]): Assignment[] {
  const offset = Math.abs(hashCode(participantId)) % conditions.length;
  return caseIds.map((caseId, index) => ({
    assignmentId: docId("assignment"),
    sessionId,
    participantId,
    caseId,
    condition: conditions[(index + offset) % conditions.length],
    order: index + 1,
    status: "not_started",
    isTutorial: false,
  }));
}

function pickAssignmentResponse(assignment: Assignment) {
  return {
    assignmentId: assignment.assignmentId,
    caseId: assignment.caseId,
    condition: assignment.condition,
    order: assignment.order,
  };
}

async function annotationMap(claimIds: string[]) {
  const result = new Map<string, unknown>();
  if (!claimIds.length) return result;
  const snap = await db.collection("audit_annotations").where("claimId", "in", claimIds.slice(0, 30)).get();
  snap.docs.forEach((doc) => {
    const data = doc.data();
    result.set(data.claimId, {
      label: data.label,
      severity: data.severity,
      evidenceRefs: data.evidenceRefs ?? [],
      missingInfo: data.missingInfo ?? [],
      explanationForUser: data.explanationForUser,
    });
  });
  return result;
}

async function safetyChecklist(caseId: string) {
  const snap = await db.collection("safety_checklists").where("caseId", "==", caseId).limit(1).get();
  if (snap.empty) return [];
  return (snap.docs[0].data().items ?? []).map((item: Record<string, unknown>) => ({
    checklistItemId: item.checklistItemId,
    text: item.text,
    order: item.order,
  }));
}

function hashCode(value: string) {
  return value.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}
