import type { Condition } from "./types.js";

export const experimentId = "medaudit-v0-2";
export const experimentVersion = "v0.2-literature-demo";

export const seedCases = [
  {
    caseId: "ckd-pain",
    title: "CKD高齢者の疼痛相談",
    domain: "medication",
    difficulty: 3,
    isTutorial: false,
    isActive: true,
    patientProfile: {
      age: 82,
      sex: "female",
      chiefComplaint: "腰痛が強く、市販薬を使ってよいか相談。",
      presentIllness: "慢性腎臓病で近医通院中。昨日から腰痛が悪化し、食欲と水分摂取が低下している。",
      pastHistory: ["慢性腎臓病 stage 3b", "高血圧", "胃潰瘍既往"],
      medications: [
        { name: "アムロジピン", dose: "5mg", frequency: "1日1回" },
        { name: "ランソプラゾール", dose: "15mg", frequency: "1日1回" },
      ],
      allergies: [],
      vitals: { bp: "138/76 mmHg", hr: "84 /min", spo2: "97%", temp: "36.9℃", rr: "16 /min" },
      labs: { Cr: "1.8 mg/dL", eGFR: "28 mL/min/1.73m2", Hb: "11.2 g/dL" },
      socialHistory: "独居。娘が週2回訪問。",
      homeCareContext: "訪問看護が月2回。水分摂取は少なめ。",
      multidisciplinaryNotes: [
        { profession: "薬剤師", note: "腎機能低下あり。NSAIDs使用には注意が必要。" },
        { profession: "看護師", note: "疼痛で歩行量が減少。脱水にも注意。" },
      ],
    },
  },
  {
    caseId: "fall-anticoagulant",
    title: "抗凝固薬内服中の転倒",
    domain: "emergency",
    difficulty: 4,
    isTutorial: false,
    isActive: true,
    patientProfile: {
      age: 78,
      sex: "male",
      chiefComplaint: "自宅で転倒し、後頭部を軽く打った。",
      presentIllness: "意識消失はない。本人は受診を希望していない。家族が電話で相談。",
      pastHistory: ["心房細動", "脳梗塞既往", "高血圧"],
      medications: [
        { name: "アピキサバン", dose: "5mg", frequency: "1日2回" },
        { name: "カンデサルタン", dose: "8mg", frequency: "1日1回" },
      ],
      allergies: [],
      vitals: { bp: "146/82 mmHg", hr: "78 /min", spo2: "98%", temp: "36.6℃", rr: "15 /min" },
      labs: { Hb: "13.1 g/dL", Plt: "18万/μL", Cr: "1.0 mg/dL" },
      socialHistory: "妻と二人暮らし。",
      homeCareContext: "最近ふらつきが増えている。介護サービスは未導入。",
      multidisciplinaryNotes: [
        { profession: "家族", note: "後頭部に小さなたんこぶがあります。" },
        { profession: "薬剤師", note: "抗凝固薬を継続中。頭部打撲時は出血リスクに注意。" },
      ],
    },
  },
  {
    caseId: "heart-failure",
    title: "在宅心不全患者の体重増加",
    domain: "home_care",
    difficulty: 3,
    isTutorial: false,
    isActive: true,
    patientProfile: {
      age: 86,
      sex: "female",
      chiefComplaint: "3日で体重が2.5kg増え、息切れがある。",
      presentIllness: "夜間の咳と下腿浮腫が増えている。次回訪問看護は5日後。",
      pastHistory: ["慢性心不全", "2型糖尿病", "CKD stage 3"],
      medications: [
        { name: "フロセミド", dose: "20mg", frequency: "朝" },
        { name: "エナラプリル", dose: "2.5mg", frequency: "朝" },
        { name: "インスリン", dose: "指示量", frequency: "就寝前" },
      ],
      allergies: [],
      vitals: { bp: "152/86 mmHg", hr: "96 /min", spo2: "92%", temp: "36.8℃", rr: "22 /min" },
      labs: { BNP: "未測定", Cr: "1.4 mg/dL", K: "4.7 mEq/L" },
      socialHistory: "娘と同居。",
      homeCareContext: "塩分摂取が増えていた可能性。通院手段の調整が必要。",
      multidisciplinaryNotes: [
        { profession: "看護師", note: "下腿浮腫あり。SpO2低め。" },
        { profession: "ケアマネ", note: "通院手段の調整が必要。" },
      ],
    },
  },
] as const;

export const seedAiOutputs = [
  {
    aiOutputId: "out-ckd-pain",
    caseId: "ckd-pain",
    outputType: "patient_explanation",
    modelName: "fixed-demo-model",
    promptVersion: "v0.2",
    text: "腰痛には市販のイブプロフェンを通常量で数日使って問題ありません。腎機能への影響は通常ほとんど心配いりません。痛みが続く場合は水分を控えて安静にしてください。胃潰瘍の既往があるため胃痛や黒色便には注意してください。",
    isActive: true,
  },
  {
    aiOutputId: "out-fall-anticoagulant",
    caseId: "fall-anticoagulant",
    outputType: "risk_assessment",
    modelName: "fixed-demo-model",
    promptVersion: "v0.2",
    text: "意識消失がなく元気であれば、自宅で様子を見てよいでしょう。抗凝固薬を飲んでいても軽い打撲なら頭蓋内出血の心配はほぼありません。頭痛、嘔吐、眠気が出る場合はすぐ受診してください。今後の転倒予防について環境調整を検討してください。",
    isActive: true,
  },
  {
    aiOutputId: "out-heart-failure",
    caseId: "heart-failure",
    outputType: "care_plan",
    modelName: "fixed-demo-model",
    promptVersion: "v0.2",
    text: "体重増加は一時的な変動としてよくあるため、次回訪問看護まで様子を見てください。息切れがある場合も安静で改善することが多いです。塩分を控え、毎日体重を測りましょう。SpO2が92%であれば緊急性はありません。",
    isActive: true,
  },
] as const;

export const seedClaims = [
  claim("ckd-c1", "out-ckd-pain", "ckd-pain", 1, "腰痛には市販のイブプロフェンを通常量で数日使って問題ありません。", "medication"),
  claim("ckd-c2", "out-ckd-pain", "ckd-pain", 2, "腎機能への影響は通常ほとんど心配いりません。", "risk"),
  claim("ckd-c3", "out-ckd-pain", "ckd-pain", 3, "痛みが続く場合は水分を控えて安静にしてください。", "education"),
  claim("ckd-c4", "out-ckd-pain", "ckd-pain", 4, "胃潰瘍の既往があるため胃痛や黒色便には注意してください。", "risk"),
  claim("fall-c1", "out-fall-anticoagulant", "fall-anticoagulant", 1, "意識消失がなく元気であれば、自宅で様子を見てよいでしょう。", "risk"),
  claim("fall-c2", "out-fall-anticoagulant", "fall-anticoagulant", 2, "抗凝固薬を飲んでいても軽い打撲なら頭蓋内出血の心配はほぼありません。", "risk"),
  claim("fall-c3", "out-fall-anticoagulant", "fall-anticoagulant", 3, "頭痛、嘔吐、眠気が出る場合はすぐ受診してください。", "follow_up"),
  claim("fall-c4", "out-fall-anticoagulant", "fall-anticoagulant", 4, "今後の転倒予防について環境調整を検討してください。", "coordination"),
  claim("hf-c1", "out-heart-failure", "heart-failure", 1, "体重増加は一時的な変動としてよくあるため、次回訪問看護まで様子を見てください。", "follow_up"),
  claim("hf-c2", "out-heart-failure", "heart-failure", 2, "息切れがある場合も安静で改善することが多いです。", "risk"),
  claim("hf-c3", "out-heart-failure", "heart-failure", 3, "塩分を控え、毎日体重を測りましょう。", "education"),
  claim("hf-c4", "out-heart-failure", "heart-failure", 4, "SpO2が92%であれば緊急性はありません。", "risk"),
] as const;

export const seedAnnotations = [
  annotation("ann-ckd-c1", "ckd-c1", "out-ckd-pain", "ckd-pain", "unsafe", 4, ["eGFR 28", "慢性腎臓病 stage 3b"], ["腎機能低下時の鎮痛薬選択"], "CKD stage 3bではNSAIDsにより腎機能悪化のリスクがあります。"),
  annotation("ann-ckd-c2", "ckd-c2", "out-ckd-pain", "ckd-pain", "contradicted", 4, ["慢性腎臓病 stage 3b", "eGFR 28"], [], "症例情報は腎機能への影響に注意すべき状況を示しています。"),
  annotation("ann-ckd-c3", "ckd-c3", "out-ckd-pain", "ckd-pain", "unsupported", 3, ["水分摂取が低下"], ["脱水リスクの確認"], "水分制限を勧める根拠はなく、脱水を悪化させる可能性があります。"),
  annotation("ann-ckd-c4", "ckd-c4", "out-ckd-pain", "ckd-pain", "supported", 2, ["胃潰瘍既往"], [], "胃潰瘍既往に基づく注意喚起として妥当です。"),
  annotation("ann-fall-c1", "fall-c1", "out-fall-anticoagulant", "fall-anticoagulant", "unsafe", 5, ["頭部打撲", "アピキサバン内服"], ["頭部CTや救急受診の要否"], "抗凝固薬内服中の頭部外傷は評価が必要です。"),
  annotation("ann-fall-c2", "fall-c2", "out-fall-anticoagulant", "fall-anticoagulant", "contradicted", 5, ["アピキサバン内服", "後頭部打撲"], [], "抗凝固薬は頭蓋内出血リスクを高めます。"),
  annotation("ann-fall-c3", "fall-c3", "out-fall-anticoagulant", "fall-anticoagulant", "supported", 3, ["頭部打撲"], [], "悪化時の受診目安として妥当です。"),
  annotation("ann-fall-c4", "fall-c4", "out-fall-anticoagulant", "fall-anticoagulant", "supported", 2, ["最近ふらつきが増えている"], [], "転倒予防は妥当な提案です。"),
  annotation("ann-hf-c1", "hf-c1", "out-heart-failure", "heart-failure", "unsafe", 4, ["3日で体重2.5kg増加", "慢性心不全"], ["早期連絡・受診判断"], "短期間の体重増加と浮腫は心不全増悪を示唆します。"),
  annotation("ann-hf-c2", "hf-c2", "out-heart-failure", "heart-failure", "unsupported", 4, ["SpO2 92%", "RR 22"], ["呼吸状態悪化の評価"], "心不全増悪の可能性があり、単なる安静指示では不十分です。"),
  annotation("ann-hf-c3", "hf-c3", "out-heart-failure", "heart-failure", "supported", 2, ["塩分摂取が増えていた可能性"], [], "生活指導として妥当です。"),
  annotation("ann-hf-c4", "hf-c4", "out-heart-failure", "heart-failure", "contradicted", 4, ["SpO2 92%", "息切れ"], ["普段のSpO2、受診基準"], "症状を伴うSpO2 92%で緊急性なしとは判断できません。"),
] as const;

export const seedGroundTruthErrors = [
  groundTruth("gte-ckd-1", "ckd-pain", "out-ckd-pain", "ckd-c1", "unsafe_recommendation", 4),
  groundTruth("gte-ckd-2", "ckd-pain", "out-ckd-pain", "ckd-c2", "contradicted", 4),
  groundTruth("gte-ckd-3", "ckd-pain", "out-ckd-pain", "ckd-c3", "unsupported", 3),
  groundTruth("gte-fall-1", "fall-anticoagulant", "out-fall-anticoagulant", "fall-c1", "unsafe_recommendation", 5),
  groundTruth("gte-fall-2", "fall-anticoagulant", "out-fall-anticoagulant", "fall-c2", "contradicted", 5),
  groundTruth("gte-hf-1", "heart-failure", "out-heart-failure", "hf-c1", "unsafe_recommendation", 4),
  groundTruth("gte-hf-2", "heart-failure", "out-heart-failure", "hf-c2", "unsupported", 4),
  groundTruth("gte-hf-3", "heart-failure", "out-heart-failure", "hf-c4", "contradicted", 4),
] as const;

export const seedSafetyChecklists = [
  checklist("checklist-ckd-pain", "ckd-pain", ["腎機能に応じた薬剤選択を確認", "NSAIDsの禁忌・慎重投与を確認", "red flag症状を確認"]),
  checklist("checklist-fall-anticoagulant", "fall-anticoagulant", ["抗凝固薬の有無を確認", "頭部外傷のred flagを確認", "受診・画像評価の必要性を確認"]),
  checklist("checklist-heart-failure", "heart-failure", ["心不全増悪サインを確認", "SpO2低下と呼吸数を確認", "早期連絡先・受診手段を確認"]),
] as const;

export const seedExperiment = {
  experimentId,
  version: experimentVersion,
  status: "active",
  caseIds: seedCases.map((item) => item.caseId),
  tutorialCaseId: "ckd-pain",
  conditions: ["control", "evidence", "audit"] as Condition[],
  randomizationMethod: "latin_square",
  casesPerParticipant: 3,
  description: "MedAudit UI literature-based demo experiment",
};

function claim(claimId: string, aiOutputId: string, caseId: string, order: number, text: string, claimType: string) {
  return { claimId, aiOutputId, caseId, order, text, claimType };
}

function annotation(
  annotationId: string,
  claimId: string,
  aiOutputId: string,
  caseId: string,
  label: string,
  severity: number,
  evidenceRefs: string[],
  missingInfo: string[],
  explanationForUser: string,
) {
  return { annotationId, claimId, aiOutputId, caseId, label, severity, evidenceRefs, missingInfo, explanationForUser };
}

function groundTruth(errorId: string, caseId: string, aiOutputId: string, claimId: string, errorType: string, severity: number) {
  return {
    errorId,
    caseId,
    aiOutputId,
    claimId,
    errorType,
    severity,
    explanation: `${claimId} contains ${errorType}.`,
    expectedCorrection: "専門家レビュー済みの修正方針に従って修正する。",
    expertReviewerIds: ["demo-reviewer"],
    consensusStatus: "consensus",
  };
}

function checklist(checklistId: string, caseId: string, items: string[]) {
  return {
    checklistId,
    caseId,
    items: items.map((text, index) => ({
      checklistItemId: `${checklistId}-item-${index + 1}`,
      text,
      order: index + 1,
      category: index === 0 ? "medication" : index === 1 ? "red_flag" : "other",
    })),
  };
}
