import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileText,
  HelpCircle,
  Info,
  ListChecks,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

type Screen = "landing" | "consent" | "profile" | "tutorial" | "experiment" | "questionnaire" | "complete" | "admin";
type Condition = "control" | "evidence" | "audit";
type ErrorType =
  | "no_problem"
  | "unsupported"
  | "contradicted"
  | "omission"
  | "unsafe_recommendation"
  | "wrong_dosage"
  | "missing_red_flag"
  | "overgeneralization"
  | "unclear_expression"
  | "other";

type ClaimLabel = "supported" | "unsupported" | "contradicted" | "not_enough_info" | "unsafe";

interface Claim {
  id: string;
  text: string;
  label: ClaimLabel;
  severity: number;
  evidenceRefs: string[];
  missingInfo?: string;
  explanation: string;
}

interface MedCase {
  id: string;
  title: string;
  domain: string;
  difficulty: number;
  patient: {
    ageSex: string;
    living: string;
    care: string;
  };
  chiefComplaint: string;
  presentIllness: string;
  pastHistory: string[];
  medications: string[];
  allergies: string;
  vitals: Array<{ k: string; v: string }>;
  labs: Array<{ k: string; v: string }>;
  homeCare: string;
  notes: Array<{ role: string; text: string }>;
  claims: Claim[];
  checklist: string[];
}

interface ClaimAnswer {
  errorType: ErrorType;
  severity: number;
  reason: string;
  correction: string;
  confidence: number;
}

interface CaseAnswer {
  caseId: string;
  condition: Condition;
  claimAnswers: Record<string, ClaimAnswer>;
  finalUseDecision: number;
  trustScore: number;
  confidenceScore: number;
  needsAdditionalCheck: boolean;
  perceivedDifficulty: number;
  workloadScore: number;
  comment: string;
  submittedAt: string;
}

interface Participant {
  role: string;
  gradeOrYear: string;
  clinicalExperienceYears: string;
  aiUsageFrequency: string;
  priorMedicalAIUse: string;
  selfRatedMedicalKnowledge: string;
}

const CONDITIONS: Condition[] = ["control", "evidence", "audit"];

const CONDITION_LABEL: Record<Condition, string> = {
  control: "Control UI",
  evidence: "Evidence UI",
  audit: "Audit UI",
};

const ERROR_TYPES: Array<{ value: ErrorType; label: string }> = [
  { value: "no_problem", label: "問題なし" },
  { value: "unsupported", label: "症例情報に根拠がない" },
  { value: "contradicted", label: "症例情報と矛盾している" },
  { value: "omission", label: "重要情報が抜けている" },
  { value: "unsafe_recommendation", label: "患者安全上危険な推奨" },
  { value: "wrong_dosage", label: "薬剤用量ミス" },
  { value: "missing_red_flag", label: "危険徴候の見逃し" },
  { value: "overgeneralization", label: "条件を無視した一般化" },
  { value: "unclear_expression", label: "誤解を招く曖昧表現" },
  { value: "other", label: "その他" },
];

const CASES: MedCase[] = [
  {
    id: "ckd-pain",
    title: "CKD高齢者の疼痛相談",
    domain: "服薬管理",
    difficulty: 3,
    patient: { ageSex: "82歳 / 女性", living: "独居", care: "訪問看護 月2回" },
    chiefComplaint: "腰痛が強く、市販薬を使ってよいか相談。",
    presentIllness: "慢性腎臓病で近医通院中。昨日から腰痛が悪化し、食欲と水分摂取が低下している。",
    pastHistory: ["慢性腎臓病 stage 3b", "高血圧", "胃潰瘍既往"],
    medications: ["アムロジピン 5mg 1日1回", "ランソプラゾール 15mg 1日1回"],
    allergies: "なし",
    vitals: [
      { k: "BP", v: "138/76 mmHg" },
      { k: "HR", v: "84 /min" },
      { k: "SpO2", v: "97%" },
      { k: "Temp", v: "36.9℃" },
      { k: "RR", v: "16 /min" },
    ],
    labs: [
      { k: "Cr", v: "1.8 mg/dL" },
      { k: "eGFR", v: "28 mL/min/1.73m2" },
      { k: "Hb", v: "11.2 g/dL" },
    ],
    homeCare: "娘が週2回訪問。最近は疼痛のため活動量が落ち、水分摂取も少ない。",
    notes: [
      { role: "薬剤師", text: "腎機能低下あり。NSAIDs使用には注意が必要。" },
      { role: "看護師", text: "疼痛で歩行量が減少。脱水にも注意。" },
    ],
    claims: [
      {
        id: "ckd-c1",
        text: "腰痛には市販のイブプロフェンを通常量で数日使って問題ありません。",
        label: "unsafe",
        severity: 4,
        evidenceRefs: ["eGFR 28 mL/min/1.73m2", "慢性腎臓病 stage 3b", "薬剤師メモ: NSAIDs使用には注意"],
        missingInfo: "腎機能低下時の鎮痛薬選択",
        explanation: "CKD stage 3bではNSAIDsにより腎機能悪化のリスクがあります。",
      },
      {
        id: "ckd-c2",
        text: "腎機能への影響は通常ほとんど心配いりません。",
        label: "contradicted",
        severity: 4,
        evidenceRefs: ["慢性腎臓病 stage 3b", "eGFR 28"],
        explanation: "症例情報は腎機能への影響に注意すべき状況を示しています。",
      },
      {
        id: "ckd-c3",
        text: "痛みが続く場合は水分を控えて安静にしてください。",
        label: "unsupported",
        severity: 3,
        evidenceRefs: ["水分摂取が低下している", "脱水にも注意"],
        missingInfo: "脱水リスク、発熱、神経症状の確認",
        explanation: "水分制限を勧める根拠はなく、脱水を悪化させる可能性があります。",
      },
      {
        id: "ckd-c4",
        text: "胃潰瘍の既往があるため胃痛や黒色便には注意してください。",
        label: "supported",
        severity: 2,
        evidenceRefs: ["胃潰瘍既往"],
        explanation: "胃潰瘍既往に基づく注意喚起として妥当です。",
      },
    ],
    checklist: ["腎機能に応じた薬剤選択を確認", "NSAIDsの禁忌・慎重投与を確認", "red flag症状を確認"],
  },
  {
    id: "fall-anticoagulant",
    title: "抗凝固薬内服中の転倒",
    domain: "高齢者救急",
    difficulty: 4,
    patient: { ageSex: "78歳 / 男性", living: "妻と二人暮らし", care: "外来通院中" },
    chiefComplaint: "自宅で転倒し、後頭部を軽く打った。",
    presentIllness: "意識消失はない。本人は受診を希望していない。家族が電話で相談。",
    pastHistory: ["心房細動", "脳梗塞既往", "高血圧"],
    medications: ["アピキサバン 5mg 1日2回", "カンデサルタン 8mg 1日1回"],
    allergies: "なし",
    vitals: [
      { k: "BP", v: "146/82 mmHg" },
      { k: "HR", v: "78 /min" },
      { k: "SpO2", v: "98%" },
      { k: "Temp", v: "36.6℃" },
      { k: "GCS", v: "15" },
    ],
    labs: [
      { k: "Hb", v: "13.1 g/dL" },
      { k: "Plt", v: "18万/μL" },
      { k: "Cr", v: "1.0 mg/dL" },
    ],
    homeCare: "最近ふらつきが増えている。介護サービスは未導入。",
    notes: [
      { role: "家族", text: "後頭部に小さなたんこぶがあります。" },
      { role: "薬剤師", text: "抗凝固薬を継続中。頭部打撲時は出血リスクに注意。" },
    ],
    claims: [
      {
        id: "fall-c1",
        text: "意識消失がなく元気であれば、自宅で様子を見てよいでしょう。",
        label: "unsafe",
        severity: 5,
        evidenceRefs: ["頭部打撲", "アピキサバン内服", "脳梗塞既往"],
        missingInfo: "頭部CTや救急受診の要否",
        explanation: "抗凝固薬内服中の頭部外傷は遅発性出血も含めて評価が必要です。",
      },
      {
        id: "fall-c2",
        text: "抗凝固薬を飲んでいても軽い打撲なら頭蓋内出血の心配はほぼありません。",
        label: "contradicted",
        severity: 5,
        evidenceRefs: ["アピキサバン内服", "後頭部打撲"],
        explanation: "抗凝固薬は頭蓋内出血リスクを高めるため、心配不要とは言えません。",
      },
      {
        id: "fall-c3",
        text: "頭痛、嘔吐、眠気が出る場合はすぐ受診してください。",
        label: "supported",
        severity: 3,
        evidenceRefs: ["頭部打撲"],
        explanation: "悪化時の受診目安として妥当です。ただし初期評価の必要性とは別です。",
      },
      {
        id: "fall-c4",
        text: "今後の転倒予防について環境調整を検討してください。",
        label: "supported",
        severity: 2,
        evidenceRefs: ["最近ふらつきが増えている"],
        explanation: "転倒予防は妥当な提案です。",
      },
    ],
    checklist: ["抗凝固薬の有無を確認", "頭部外傷のred flagを確認", "受診・画像評価の必要性を確認"],
  },
  {
    id: "heart-failure",
    title: "在宅心不全患者の体重増加",
    domain: "在宅医療",
    difficulty: 3,
    patient: { ageSex: "86歳 / 女性", living: "娘と同居", care: "訪問看護 週1回" },
    chiefComplaint: "3日で体重が2.5kg増え、息切れがある。",
    presentIllness: "夜間の咳と下腿浮腫が増えている。次回訪問看護は5日後。",
    pastHistory: ["慢性心不全", "2型糖尿病", "CKD stage 3"],
    medications: ["フロセミド 20mg 朝", "エナラプリル 2.5mg 朝", "インスリン"],
    allergies: "なし",
    vitals: [
      { k: "BP", v: "152/86 mmHg" },
      { k: "HR", v: "96 /min" },
      { k: "SpO2", v: "92%" },
      { k: "Temp", v: "36.8℃" },
      { k: "RR", v: "22 /min" },
    ],
    labs: [
      { k: "BNP", v: "未測定" },
      { k: "Cr", v: "1.4 mg/dL" },
      { k: "K", v: "4.7 mEq/L" },
    ],
    homeCare: "塩分摂取が増えていた可能性。通院手段の調整が必要。",
    notes: [
      { role: "看護師", text: "下腿浮腫あり。SpO2低め。" },
      { role: "ケアマネ", text: "通院手段の調整が必要。" },
    ],
    claims: [
      {
        id: "hf-c1",
        text: "体重増加は一時的な変動としてよくあるため、次回訪問看護まで様子を見てください。",
        label: "unsafe",
        severity: 4,
        evidenceRefs: ["3日で体重2.5kg増加", "慢性心不全", "下腿浮腫"],
        missingInfo: "心不全増悪としての早期連絡・受診判断",
        explanation: "短期間の体重増加と浮腫は心不全増悪を示唆します。",
      },
      {
        id: "hf-c2",
        text: "息切れがある場合も安静で改善することが多いです。",
        label: "unsupported",
        severity: 4,
        evidenceRefs: ["SpO2 92%", "RR 22", "夜間の咳"],
        missingInfo: "呼吸状態悪化の評価",
        explanation: "心不全増悪の可能性があり、単なる安静指示では不十分です。",
      },
      {
        id: "hf-c3",
        text: "塩分を控え、毎日体重を測りましょう。",
        label: "supported",
        severity: 2,
        evidenceRefs: ["塩分摂取が増えていた可能性", "心不全"],
        explanation: "生活指導として妥当です。",
      },
      {
        id: "hf-c4",
        text: "SpO2が92%であれば緊急性はありません。",
        label: "contradicted",
        severity: 4,
        evidenceRefs: ["SpO2 92%", "息切れ", "RR 22"],
        missingInfo: "普段のSpO2、呼吸苦の程度、受診基準",
        explanation: "症状を伴う低めのSpO2で、緊急性なしとは判断できません。",
      },
    ],
    checklist: ["心不全増悪サインを確認", "SpO2低下と呼吸数を確認", "早期連絡先・受診手段を確認"],
  },
];

const emptyParticipant: Participant = {
  role: "",
  gradeOrYear: "",
  clinicalExperienceYears: "",
  aiUsageFrequency: "",
  priorMedicalAIUse: "",
  selfRatedMedicalKnowledge: "",
};

const labelClass: Record<ClaimLabel, string> = {
  supported: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unsupported: "bg-rose-50 text-rose-700 border-rose-200",
  contradicted: "bg-rose-50 text-rose-700 border-rose-200",
  not_enough_info: "bg-amber-50 text-amber-700 border-amber-200",
  unsafe: "bg-red-50 text-red-700 border-red-200",
};

const labelText: Record<ClaimLabel, string> = {
  supported: "根拠あり",
  unsupported: "根拠不足",
  contradicted: "矛盾",
  not_enough_info: "情報不足",
  unsafe: "危険",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [consented, setConsented] = useState(false);
  const [participant, setParticipant] = useState<Participant>(emptyParticipant);
  const [profileError, setProfileError] = useState("");
  const [caseIndex, setCaseIndex] = useState(0);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(CASES[0].claims[0].id);
  const [claimDrafts, setClaimDrafts] = useState<Record<string, ClaimAnswer>>({});
  const [answers, setAnswers] = useState<CaseAnswer[]>([]);
  const [questionnaire, setQuestionnaire] = useState({
    usability: 3,
    suspicionEase: 3,
    evidenceUsefulness: 3,
    dangerHighlightUsefulness: 3,
    checklistUsefulness: 3,
    adoptionIntent: 3,
    comment: "",
  });

  const currentCase = CASES[caseIndex];
  const currentCondition = CONDITIONS[caseIndex % CONDITIONS.length];
  const selectedClaim = currentCase.claims.find((claim) => claim.id === selectedClaimId) ?? currentCase.claims[0];

  const uiEventCount = useMemo(() => {
    const claimEvents = Object.keys(claimDrafts).length;
    return claimEvents + answers.length * 4;
  }, [answers.length, claimDrafts]);

  function updateParticipant(key: keyof Participant, value: string) {
    setParticipant((current) => ({ ...current, [key]: value }));
  }

  function continueProfile() {
    if (!participant.role || !participant.aiUsageFrequency || !participant.priorMedicalAIUse) {
      setProfileError("必須項目を入力してください。");
      return;
    }
    setProfileError("");
    setScreen("tutorial");
  }

  function saveClaimAnswer(claimId: string, answer: ClaimAnswer) {
    setClaimDrafts((current) => ({ ...current, [claimId]: answer }));
  }

  function submitCase(finalForm: Omit<CaseAnswer, "caseId" | "condition" | "claimAnswers" | "submittedAt">) {
    const submitted: CaseAnswer = {
      ...finalForm,
      caseId: currentCase.id,
      condition: currentCondition,
      claimAnswers: claimDrafts,
      submittedAt: new Date().toISOString(),
    };
    setAnswers((current) => [...current, submitted]);
    setClaimDrafts({});
    const nextIndex = caseIndex + 1;
    if (nextIndex >= CASES.length) {
      setScreen("questionnaire");
      return;
    }
    setCaseIndex(nextIndex);
    setSelectedClaimId(CASES[nextIndex].claims[0].id);
  }

  function resetDemo() {
    setScreen("landing");
    setConsented(false);
    setParticipant(emptyParticipant);
    setCaseIndex(0);
    setSelectedClaimId(CASES[0].claims[0].id);
    setClaimDrafts({});
    setAnswers([]);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {screen !== "experiment" && screen !== "tutorial" ? (
        <Header onAdmin={() => setScreen("admin")} onHome={() => setScreen("landing")} />
      ) : null}

      {screen === "landing" ? (
        <Landing onStart={() => setScreen("consent")} onAdmin={() => setScreen("admin")} />
      ) : null}
      {screen === "consent" ? (
        <Consent consented={consented} setConsented={setConsented} onNext={() => setScreen("profile")} />
      ) : null}
      {screen === "profile" ? (
        <Profile participant={participant} update={updateParticipant} error={profileError} onNext={continueProfile} />
      ) : null}
      {screen === "tutorial" ? (
        <ReviewShell
          mode="tutorial"
          medCase={CASES[0]}
          condition="audit"
          casePositionLabel="チュートリアル"
          selectedClaim={selectedClaim}
          selectedClaimId={selectedClaimId}
          setSelectedClaimId={setSelectedClaimId}
          claimDrafts={claimDrafts}
          saveClaimAnswer={saveClaimAnswer}
          onSubmitCase={() => {
            setClaimDrafts({});
            setSelectedClaimId(CASES[0].claims[0].id);
            setScreen("experiment");
          }}
        />
      ) : null}
      {screen === "experiment" ? (
        <ReviewShell
          mode="experiment"
          medCase={currentCase}
          condition={currentCondition}
          casePositionLabel={`症例 ${caseIndex + 1} / ${CASES.length}`}
          selectedClaim={selectedClaim}
          selectedClaimId={selectedClaimId}
          setSelectedClaimId={setSelectedClaimId}
          claimDrafts={claimDrafts}
          saveClaimAnswer={saveClaimAnswer}
          onSubmitCase={submitCase}
        />
      ) : null}
      {screen === "questionnaire" ? (
        <Questionnaire
          questionnaire={questionnaire}
          setQuestionnaire={setQuestionnaire}
          onComplete={() => setScreen("complete")}
        />
      ) : null}
      {screen === "complete" ? <Complete onAdmin={() => setScreen("admin")} /> : null}
      {screen === "admin" ? (
        <Admin
          participant={participant}
          answers={answers}
          cases={CASES}
          uiEventCount={uiEventCount}
          onReset={resetDemo}
        />
      ) : null}
    </div>
  );
}

function Header({ onHome, onAdmin }: { onHome: () => void; onAdmin: () => void }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button className="flex items-center gap-3 text-left" onClick={onHome}>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-lg font-semibold">MedAudit UI</div>
            <div className="text-xs text-slate-500">医療AI監査研究プロトタイプ</div>
          </div>
        </button>
        <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100" onClick={onAdmin}>
          管理画面
        </button>
      </div>
    </header>
  );
}

function Landing({ onStart, onAdmin }: { onStart: () => void; onAdmin: () => void }) {
  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="pt-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          <Stethoscope size={16} />
          模擬症例のみを使用
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950">
          医療LLM出力を、人間が安全に監査するための実験システム
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          本研究では、模擬医療ケースとAI生成テキストを確認し、医学的誤り、根拠不足、危険な推奨、red flagの見逃しを検出してもらいます。
          通常表示、根拠提示、監査支援の3条件を比較します。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700" onClick={onStart}>
            実験を開始する
          </button>
          <button className="rounded-md border border-slate-300 bg-white px-5 py-3 font-semibold hover:bg-slate-100" onClick={onAdmin}>
            デモデータを見る
          </button>
        </div>
        <p className="mt-5 text-sm text-slate-500">
          所要時間: 約30〜40分 / 対象: 医学生、研修医、医師、看護師、薬剤師、ケアマネジャー
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold">比較するUI条件</h2>
        <ConditionCard title="Control UI" tone="neutral" text="AI出力のみを提示し、参加者が自力で誤りを探します。" />
        <ConditionCard title="Evidence UI" tone="blue" text="claimごとに根拠ラベルと根拠詳細を表示します。" />
        <ConditionCard title="Audit UI" tone="red" text="危険ハイライト、Missing Info、Safety Checklistを追加します。" />
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          実患者データは使用しません。AI出力は研究用であり、臨床判断には使用できません。
        </div>
      </section>
    </main>
  );
}

function ConditionCard({ title, text, tone }: { title: string; text: string; tone: "neutral" | "blue" | "red" }) {
  const color = tone === "blue" ? "border-blue-200 bg-blue-50" : tone === "red" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50";
  return (
    <div className={`mb-3 rounded-md border p-4 ${color}`}>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{text}</div>
    </div>
  );
}

function Consent({ consented, setConsented, onNext }: { consented: boolean; setConsented: (value: boolean) => void; onNext: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">研究説明と同意</h1>
        <div className="mt-6 space-y-5 text-slate-700">
          <InfoBlock title="研究目的" items={["医療LLM出力に対する監査UIが、重大医学的エラー検出率、過信、確認時間、主観的負担に与える影響を評価します。"]} />
          <InfoBlock title="収集するデータ" items={["役割、AI使用歴、回答内容、claim選択、操作ログ"]} />
          <InfoBlock title="収集しないデータ" items={["氏名、学籍番号、メールアドレス、実患者データ"]} />
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-800">
            すべて模擬症例です。AI出力は研究目的のみで、臨床使用はできません。参加は任意で、途中離脱できます。
          </div>
        </div>
        <label className="mt-6 flex items-start gap-3 rounded-md border border-slate-200 p-4">
          <input className="mt-1 h-4 w-4" type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} />
          <span>上記の説明を読み、研究参加に同意します。</span>
        </label>
        <button
          className="mt-6 rounded-md bg-blue-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!consented}
          onClick={onNext}
        >
          同意して次へ
        </button>
      </section>
    </main>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="font-semibold text-slate-950">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Profile({
  participant,
  update,
  error,
  onNext,
}: {
  participant: Participant;
  update: (key: keyof Participant, value: string) => void;
  error: string;
  onNext: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">参加者属性</h1>
        <p className="mt-2 text-sm text-slate-500">匿名IDに紐づく背景情報のみを収集します。</p>
        <div className="mt-6 grid gap-5">
          <SelectField label="役割" value={participant.role} onChange={(v) => update("role", v)} options={["", "医学生", "研修医", "医師", "看護師", "薬剤師", "ケアマネジャー", "その他"]} />
          <InputField label="学年・年次" value={participant.gradeOrYear} onChange={(v) => update("gradeOrYear", v)} placeholder="例: M3、PGY-2" />
          <InputField label="臨床経験年数" value={participant.clinicalExperienceYears} onChange={(v) => update("clinicalExperienceYears", v)} placeholder="0" type="number" />
          <SelectField label="AI使用頻度" value={participant.aiUsageFrequency} onChange={(v) => update("aiUsageFrequency", v)} options={["", "なし", "まれ", "月数回", "週数回", "毎日"]} />
          <SelectField label="医療AI利用経験" value={participant.priorMedicalAIUse} onChange={(v) => update("priorMedicalAIUse", v)} options={["", "なし", "教育", "研究", "臨床", "その他"]} />
          <SelectField label="医学知識の自己評価" value={participant.selfRatedMedicalKnowledge} onChange={(v) => update("selfRatedMedicalKnowledge", v)} options={["", "1 まったく自信なし", "2", "3", "4", "5 非常に自信あり"]} />
        </div>
        {error ? <p className="mt-4 text-sm font-medium text-rose-700">{error}</p> : null}
        <button className="mt-6 rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700" onClick={onNext}>
          チュートリアルへ進む
        </button>
      </section>
    </main>
  );
}

function ReviewShell({
  mode,
  medCase,
  condition,
  casePositionLabel,
  selectedClaim,
  selectedClaimId,
  setSelectedClaimId,
  claimDrafts,
  saveClaimAnswer,
  onSubmitCase,
}: {
  mode: "tutorial" | "experiment";
  medCase: MedCase;
  condition: Condition;
  casePositionLabel: string;
  selectedClaim: Claim;
  selectedClaimId: string;
  setSelectedClaimId: (id: string) => void;
  claimDrafts: Record<string, ClaimAnswer>;
  saveClaimAnswer: (claimId: string, answer: ClaimAnswer) => void;
  onSubmitCase: (answer: Omit<CaseAnswer, "caseId" | "condition" | "claimAnswers" | "submittedAt">) => void;
}) {
  return (
    <main className="h-screen overflow-hidden bg-slate-100">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <span className="font-semibold">{casePositionLabel}</span>
          <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600" style={{ width: mode === "tutorial" ? "12%" : "66%" }} />
          </div>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={20} className="text-blue-600" />
          MedAudit UI
        </div>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          {CONDITION_LABEL[condition]}
        </span>
      </div>

      {mode === "tutorial" ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-900">
          練習: AI出力のclaimをクリックし、右側の監査パネルで分類してください。完了後に実験を開始できます。
        </div>
      ) : null}

      <div className="grid h-[calc(100vh-64px)] grid-cols-[25%_45%_30%] gap-3 p-3">
        <CasePanel medCase={medCase} />
        <AIOutputPanel
          medCase={medCase}
          condition={condition}
          selectedClaimId={selectedClaimId}
          claimDrafts={claimDrafts}
          setSelectedClaimId={setSelectedClaimId}
        />
        <AuditPanel
          key={selectedClaim.id}
          mode={mode}
          medCase={medCase}
          condition={condition}
          selectedClaim={selectedClaim}
          draft={claimDrafts[selectedClaim.id]}
          saveClaimAnswer={saveClaimAnswer}
          onSubmitCase={onSubmitCase}
        />
      </div>
    </main>
  );
}

function CasePanel({ medCase }: { medCase: MedCase }) {
  return (
    <section className="overflow-auto rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">症例情報</h2>
      <p className="mt-1 text-sm text-slate-500">{medCase.title}</p>
      <PanelSection title="患者">
        <KV rows={[["年齢・性別", medCase.patient.ageSex], ["生活", medCase.patient.living], ["ケア", medCase.patient.care]]} />
      </PanelSection>
      <PanelSection title="主訴">
        <p>{medCase.chiefComplaint}</p>
      </PanelSection>
      <PanelSection title="現病歴">
        <p>{medCase.presentIllness}</p>
      </PanelSection>
      <PanelSection title="既往歴">
        <BulletList items={medCase.pastHistory} />
      </PanelSection>
      <PanelSection title="内服薬">
        <BulletList items={medCase.medications} />
      </PanelSection>
      <PanelSection title="アレルギー">
        <p>{medCase.allergies}</p>
      </PanelSection>
      <PanelSection title="バイタル">
        <KV rows={medCase.vitals.map((row) => [row.k, row.v])} />
      </PanelSection>
      <PanelSection title="検査値">
        <KV rows={medCase.labs.map((row) => [row.k, row.v])} />
      </PanelSection>
      <PanelSection title="在宅・介護背景">
        <p>{medCase.homeCare}</p>
      </PanelSection>
      <PanelSection title="多職種メモ">
        <div className="space-y-3">
          {medCase.notes.map((note) => (
            <div className="rounded-md bg-slate-50 p-3" key={note.role}>
              <div className="text-xs font-semibold text-slate-500">{note.role}</div>
              <p className="mt-1 text-sm">{note.text}</p>
            </div>
          ))}
        </div>
      </PanelSection>
    </section>
  );
}

function AIOutputPanel({
  medCase,
  condition,
  selectedClaimId,
  claimDrafts,
  setSelectedClaimId,
}: {
  medCase: MedCase;
  condition: Condition;
  selectedClaimId: string;
  claimDrafts: Record<string, ClaimAnswer>;
  setSelectedClaimId: (id: string) => void;
}) {
  return (
    <section className="overflow-auto rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI生成ケア提案</h2>
          <p className="text-sm text-slate-500">claim単位でクリックして監査します。</p>
        </div>
        <FileText className="text-slate-400" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-[15px] leading-8">
        {medCase.claims.map((claim) => {
          const selected = claim.id === selectedClaimId;
          const answered = claimDrafts[claim.id];
          const dangerous = condition === "audit" && claim.severity >= 4;
          return (
            <button
              key={claim.id}
              className={[
                "mx-0.5 rounded-md px-1.5 py-1 text-left transition",
                selected ? "ring-2 ring-blue-500" : "hover:bg-blue-50",
                answered?.errorType && answered.errorType !== "no_problem" ? "underline decoration-rose-500 decoration-2 underline-offset-4" : "",
                answered?.errorType === "no_problem" ? "underline decoration-slate-400 decoration-2 underline-offset-4" : "",
                dangerous ? "bg-rose-100" : "",
              ].join(" ")}
              onClick={() => setSelectedClaimId(claim.id)}
            >
              {claim.text}
              {condition !== "control" ? (
                <span className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${labelClass[claim.label]}`}>
                  {labelText[claim.label]}
                </span>
              ) : null}
              {condition === "audit" && claim.severity >= 4 ? (
                <span className="ml-1 inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  S{claim.severity}
                </span>
              ) : null}{" "}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AuditPanel({
  mode,
  medCase,
  condition,
  selectedClaim,
  draft,
  saveClaimAnswer,
  onSubmitCase,
}: {
  mode: "tutorial" | "experiment";
  medCase: MedCase;
  condition: Condition;
  selectedClaim: Claim;
  draft?: ClaimAnswer;
  saveClaimAnswer: (claimId: string, answer: ClaimAnswer) => void;
  onSubmitCase: (answer: Omit<CaseAnswer, "caseId" | "condition" | "claimAnswers" | "submittedAt">) => void;
}) {
  const [errorType, setErrorType] = useState<ErrorType>(draft?.errorType ?? "no_problem");
  const [severity, setSeverity] = useState(draft?.severity ?? 3);
  const [reason, setReason] = useState(draft?.reason ?? "");
  const [correction, setCorrection] = useState(draft?.correction ?? "");
  const [claimConfidence, setClaimConfidence] = useState(draft?.confidence ?? 70);
  const [finalUseDecision, setFinalUseDecision] = useState(3);
  const [trustScore, setTrustScore] = useState(50);
  const [confidenceScore, setConfidenceScore] = useState(60);
  const [needsAdditionalCheck, setNeedsAdditionalCheck] = useState(true);
  const [perceivedDifficulty, setPerceivedDifficulty] = useState(3);
  const [workloadScore, setWorkloadScore] = useState(4);
  const [comment, setComment] = useState("");

  return (
    <section className="overflow-auto rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">監査パネル</h2>
      <div className="mt-4 rounded-lg border border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-500">選択中のclaim</div>
        <p className="mt-2 text-sm leading-6">{selectedClaim.text}</p>
        {condition !== "control" ? (
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
            <div className="flex items-center gap-2 font-semibold text-blue-800">
              <Info size={16} />
              根拠ラベル: {labelText[selectedClaim.label]}
            </div>
            <p className="mt-2 text-blue-900">{selectedClaim.explanation}</p>
            <div className="mt-3 rounded-md bg-white p-3">
              <div className="text-xs font-semibold text-slate-500">根拠</div>
              <BulletList items={selectedClaim.evidenceRefs} />
            </div>
          </div>
        ) : null}
        {condition === "audit" && selectedClaim.missingInfo ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Missing Info: {selectedClaim.missingInfo}
          </div>
        ) : null}
        <div className="mt-4 grid gap-3">
          <SelectField label="エラー分類" value={errorType} onChange={(v) => setErrorType(v as ErrorType)} options={ERROR_TYPES.map((item) => item.label)} values={ERROR_TYPES.map((item) => item.value)} />
          <RangeField label="重大度" min={1} max={5} value={severity} setValue={setSeverity} />
          <TextArea label="判断理由" value={reason} onChange={setReason} />
          <TextArea label="修正案" value={correction} onChange={setCorrection} />
          <RangeField label="この判断への自信度" min={0} max={100} value={claimConfidence} setValue={setClaimConfidence} />
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => saveClaimAnswer(selectedClaim.id, { errorType, severity, reason, correction, confidence: claimConfidence })}
          >
            このclaimを確定
          </button>
        </div>
      </div>

      {condition === "audit" ? (
        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <ListChecks size={18} className="text-blue-600" />
            Safety Checklist
          </div>
          <div className="space-y-2">
            {medCase.checklist.map((item) => (
              <label className="flex items-center gap-2 text-sm" key={item}>
                <input type="checkbox" className="h-4 w-4" />
                {item}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold">症例ごとの最終判断</h3>
        <div className="mt-4 grid gap-3">
          <RangeField label="このAI出力をそのまま使えると思うか" min={1} max={5} value={finalUseDecision} setValue={setFinalUseDecision} />
          <RangeField label="AI出力をどの程度信頼したか" min={0} max={100} value={trustScore} setValue={setTrustScore} />
          <RangeField label="自分の判断への自信" min={0} max={100} value={confidenceScore} setValue={setConfidenceScore} />
          <label className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
            追加確認が必要
            <input type="checkbox" checked={needsAdditionalCheck} onChange={(event) => setNeedsAdditionalCheck(event.target.checked)} />
          </label>
          <RangeField label="ケースの難易度" min={1} max={5} value={perceivedDifficulty} setValue={setPerceivedDifficulty} />
          <RangeField label="精神的負担" min={1} max={7} value={workloadScore} setValue={setWorkloadScore} />
          <TextArea label="自由記述コメント" value={comment} onChange={setComment} />
          <button
            className="rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            onClick={() =>
              onSubmitCase({
                finalUseDecision,
                trustScore,
                confidenceScore,
                needsAdditionalCheck,
                perceivedDifficulty,
                workloadScore,
                comment,
              })
            }
          >
            {mode === "tutorial" ? "チュートリアルを完了して実験開始" : "回答を送信する"}
          </button>
        </div>
      </div>
    </section>
  );
}

function Questionnaire({
  questionnaire,
  setQuestionnaire,
  onComplete,
}: {
  questionnaire: {
    usability: number;
    suspicionEase: number;
    evidenceUsefulness: number;
    dangerHighlightUsefulness: number;
    checklistUsefulness: number;
    adoptionIntent: number;
    comment: string;
  };
  setQuestionnaire: (value: any) => void;
  onComplete: () => void;
}) {
  function update(key: string, value: number | string) {
    setQuestionnaire((current: any) => ({ ...current, [key]: value }));
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">事後アンケート</h1>
        <div className="mt-6 grid gap-5">
          <RangeField label="UIは使いやすかったか" min={1} max={5} value={questionnaire.usability} setValue={(v) => update("usability", v)} />
          <RangeField label="AI出力を疑いやすかったか" min={1} max={5} value={questionnaire.suspicionEase} setValue={(v) => update("suspicionEase", v)} />
          <RangeField label="根拠表示は役立ったか" min={1} max={5} value={questionnaire.evidenceUsefulness} setValue={(v) => update("evidenceUsefulness", v)} />
          <RangeField label="危険ハイライトは役立ったか" min={1} max={5} value={questionnaire.dangerHighlightUsefulness} setValue={(v) => update("dangerHighlightUsefulness", v)} />
          <RangeField label="チェックリストは役立ったか" min={1} max={5} value={questionnaire.checklistUsefulness} setValue={(v) => update("checklistUsefulness", v)} />
          <RangeField label="実際の医療現場で使いたいか" min={1} max={5} value={questionnaire.adoptionIntent} setValue={(v) => update("adoptionIntent", v)} />
          <TextArea label="改善点・感想" value={questionnaire.comment} onChange={(v) => update("comment", v)} />
        </div>
        <button className="mt-6 rounded-md bg-blue-600 px-5 py-3 font-semibold text-white" onClick={onComplete}>
          完了する
        </button>
      </section>
    </main>
  );
}

function Complete({ onAdmin }: { onAdmin: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
        <h1 className="mt-4 text-2xl font-semibold">実験は完了しました</h1>
        <p className="mt-3 text-slate-600">ご協力ありがとうございました。回答データは匿名IDに紐づく研究データとして扱われます。</p>
        <button className="mt-6 rounded-md border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-100" onClick={onAdmin}>
          管理画面で確認する
        </button>
      </section>
    </main>
  );
}

function Admin({
  participant,
  answers,
  cases,
  uiEventCount,
  onReset,
}: {
  participant: Participant;
  answers: CaseAnswer[];
  cases: MedCase[];
  uiEventCount: number;
  onReset: () => void;
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">管理ダッシュボード</h1>
          <p className="mt-1 text-sm text-slate-500">ローカルMVP用の進捗確認とエクスポート画面です。</p>
        </div>
        <button className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700" onClick={onReset}>
          デモを初期化
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<Users size={20} />} label="参加者" value={participant.role ? "1" : "0"} />
        <Metric icon={<ClipboardCheck size={20} />} label="回答済み症例" value={`${answers.length} / ${cases.length}`} />
        <Metric icon={<BarChart3 size={20} />} label="UIイベント" value={String(uiEventCount)} />
        <Metric icon={<ShieldCheck size={20} />} label="実験条件" value="3条件" />
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">回答一覧</h2>
          <div className="flex gap-2">
            <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100" onClick={() => download("case_answers.json", JSON.stringify(answers, null, 2))}>
              <Download className="mr-2 inline" size={16} />
              JSON
            </button>
            <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => download("case_answers.csv", toCsv(answers))}>
              <Download className="mr-2 inline" size={16} />
              CSV
            </button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="border-b p-3">症例</th>
                <th className="border-b p-3">条件</th>
                <th className="border-b p-3">そのまま使える</th>
                <th className="border-b p-3">信頼度</th>
                <th className="border-b p-3">負担</th>
                <th className="border-b p-3">送信時刻</th>
              </tr>
            </thead>
            <tbody>
              {answers.map((answer) => (
                <tr key={`${answer.caseId}-${answer.submittedAt}`}>
                  <td className="border-b p-3">{cases.find((item) => item.id === answer.caseId)?.title}</td>
                  <td className="border-b p-3">{CONDITION_LABEL[answer.condition]}</td>
                  <td className="border-b p-3">{answer.finalUseDecision}</td>
                  <td className="border-b p-3">{answer.trustScore}</td>
                  <td className="border-b p-3">{answer.workloadScore}</td>
                  <td className="border-b p-3">{answer.submittedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {cases.map((item) => (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={item.id}>
            <div className="text-sm font-semibold text-slate-500">{item.domain}</div>
            <h3 className="mt-2 font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">claim数: {item.claims.length} / 難易度: {item.difficulty}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-sm">{label}</span></div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="text-sm leading-6 text-slate-800">{children}</div>
    </div>
  );
}

function KV({ rows }: { rows: string[][] }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td className="border-b border-slate-100 py-1.5 pr-3 font-medium text-slate-500">{k}</td>
            <td className="border-b border-slate-100 py-1.5">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  values,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  values?: string[];
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <select className="h-10 rounded-md border border-slate-300 bg-white px-3" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option, index) => (
          <option key={`${option}-${index}`} value={values ? values[index] : option}>
            {option || "選択してください"}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input className="h-10 rounded-md border border-slate-300 px-3" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <textarea className="min-h-20 rounded-md border border-slate-300 p-3" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function RangeField({
  label,
  min,
  max,
  value,
  setValue,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  setValue: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span className="flex items-center justify-between">
        {label}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{value}</span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => setValue(Number(event.target.value))} />
    </label>
  );
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: filename.endsWith(".csv") ? "text/csv" : "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: CaseAnswer[]) {
  const header = ["caseId", "condition", "finalUseDecision", "trustScore", "confidenceScore", "needsAdditionalCheck", "perceivedDifficulty", "workloadScore", "submittedAt"];
  const body = rows.map((row) => header.map((key) => JSON.stringify((row as any)[key] ?? "")).join(","));
  return `\ufeff${header.join(",")}\n${body.join("\n")}`;
}
