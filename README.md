# MedAudit UI

医療LLM出力を、人間が安全かつ過度な負担なく監査できるかを評価する研究用Webシステムです。

## Frontend

Vite / React / TypeScript で実装しています。

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Backend

Firebase Auth / Firestore / Cloud Functions v2 のバックエンドを `functions/` に実装しています。

詳細は [BACKEND.md](./BACKEND.md) を参照してください。

実装済みの主なAPI:

- `createParticipant`
- `assignExperimentSession`
- `getCaseForReview`
- `getNextAssignment`
- `submitCaseAnswer`
- `logUIEvents`
- `submitQuestionnaire`
- `adminGetParticipants`
- `exportStudyData`
- `seedDemoData`

## Research Data Model

Firestoreの主なコレクション:

- `participants`
- `sessions`
- `case_assignments`
- `case_answers`
- `selected_error_answers`
- `ui_events`
- `questionnaires`
- `cases`
- `ai_outputs`
- `claims`
- `audit_annotations`
- `ground_truth_errors`
- `safety_checklists`
- `experiments`

## Current Deployment

Vercel frontend:

https://medaudit-ui.vercel.app

Firebase backend is implemented in the repository, but deployment requires a Firebase project ID and Firebase CLI login.
