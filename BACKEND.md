# MedAudit UI Backend

Firebase Auth / Firestore / Cloud Functions v2 で、研究要件定義に沿ったバックエンドを実装しています。

## 実装済みFunctions

| Function | 目的 |
|---|---|
| `createParticipant` | Firebase Anonymous AuthのUIDを参加者IDとして、`participants` と `sessions` を作成 |
| `assignExperimentSession` | active experimentから症例を取得し、Latin Square風に症例×UI条件を割付 |
| `getCaseForReview` | UI条件に応じて、Controlでは注釈なし、Evidenceでは根拠注釈、Auditでは根拠注釈+チェックリストを返す |
| `getNextAssignment` | 次の未提出assignmentを返す。全完了ならsessionをcompletedに更新 |
| `submitCaseAnswer` | 回答を冪等保存し、`selected_error_answers` にground truth照合結果を付与 |
| `logUIEvents` | claimクリック、Evidence Drawer、Checklist操作などのイベントをバッチ保存 |
| `submitQuestionnaire` | 事後アンケートを保存 |
| `adminGetParticipants` | 管理者向けに参加者・セッション・回答を取得 |
| `exportStudyData` | 指定テーブルをJSON形式で返し、`exports` にジョブ記録を作成 |
| `seedDemoData` | デモ症例、AI出力、claims、annotation、ground truth、checklist、experimentを投入 |

## Firestore Collections

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
- `admin_users`
- `exports`

## ローカル確認

```bash
cd functions
npm install
npm run build
```

## Firebase初期設定

```bash
cp .firebaserc.example .firebaserc
```

`.firebaserc` の `YOUR_FIREBASE_PROJECT_ID` を実際のFirebase Project IDに変更します。

Firebase CLIが未インストールの場合:

```bash
npm install -g firebase-tools
firebase login
```

## デプロイ

```bash
npm run build
firebase deploy --only functions,firestore:rules,firestore:indexes
```

## 管理者登録

`admin_users/{uid}` に管理者のFirebase Auth UIDを登録すると、管理者Functionsと管理画面用データにアクセスできます。

例:

```json
{
  "uid": "firebase-auth-admin-uid",
  "email": "admin@example.com",
  "createdAt": "server timestamp"
}
```

## デモデータ投入

管理者IDトークンを付けて `seedDemoData` をPOSTします。

```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_FIREBASE_ID_TOKEN>" \
  https://asia-northeast1-<PROJECT_ID>.cloudfunctions.net/seedDemoData
```

## 注意

現在のVercel公開フロントは、先生に見せるためのプロトタイプとしてフロント内状態でも動作します。  
本番実験ではFirebase設定を追加し、フロントの保存・取得処理をこのFunctions APIへ接続します。
