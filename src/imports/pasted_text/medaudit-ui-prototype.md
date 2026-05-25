Create a high-fidelity interactive web app prototype for a medical AI safety research system called “MedAudit UI”.

Product context:
MedAudit UI is a research experiment web application that evaluates whether a human-facing audit interface helps users detect errors in medical LLM outputs. Participants review simulated medical cases and AI-generated clinical text, then identify unsupported claims, contradictions, omissions, unsafe recommendations, and missing red flags. The app compares three UI conditions: Control, Evidence, and Audit.

Design goal:
Create a clean, serious, trustworthy, research-grade medical interface. It should feel like a modern clinical decision support / research dashboard, not a consumer wellness app. Use a calm medical design language with generous spacing, clear hierarchy, readable typography, subtle borders, soft shadows, and accessible contrast.

Target device:
Desktop and tablet web app. The main experiment screen should be optimized for a minimum width of 1024px. Use responsive behavior, but prioritize desktop.

Visual style:
- Modern clinical SaaS interface
- White and very light gray background
- Accent colors:
  - Blue for selected or active states
  - Green for supported / safe information
  - Yellow or amber for missing information / needs review
  - Red for unsafe / critical risk
  - Gray for neutral or completed states
- Use cards, panels, badges, accordions, sliders, radio groups, checkboxes, and progress indicators
- Avoid playful illustrations
- Avoid emoji-heavy design
- Keep it professional, precise, and usable for medical students, clinicians, and researchers

Core user flow:
1. Landing page
2. Consent page
3. Participant profile page
4. Tutorial page
5. Experiment case review page
6. Post-study questionnaire page
7. Complete page
8. Admin dashboard pages

Build the prototype with realistic sample data and clickable interactions.

---

SCREEN 1: Landing Page

Purpose:
Introduce the study and let users start the experiment.

Content:
- Header: “MedAudit UI”
- Subtitle: “A research prototype for safer human review of medical AI outputs”
- Short explanation:
  “In this study, you will review simulated medical cases and AI-generated clinical text. Your task is to identify potential medical errors, unsupported claims, and unsafe recommendations.”
- Estimated time: “Estimated time: 30–40 minutes”
- Eligibility: “Medical students, residents, physicians, nurses, pharmacists, and care managers”
- Primary button: “Start Experiment”
- Secondary small text: “This is a research prototype. No real patient data is used.”

Interaction:
Click “Start Experiment” to go to Consent.

---

SCREEN 2: Consent Page

Purpose:
Show study information and collect consent.

Layout:
Single-column centered form inside a large card.

Content sections:
- Study purpose
- What data will be collected:
  - Role
  - Medical AI usage history
  - Answers
  - Interaction logs
- What data will NOT be collected:
  - Name
  - Student ID
  - Email address
  - Real patient data
- Voluntary participation
- Right to withdraw
- Clinical safety note:
  “All cases are simulated. AI outputs are for research purposes only and must not be used for clinical care.”

Form:
- One required checkbox:
  “I have read the explanation above and agree to participate.”
- Button:
  “Agree and Continue”

Interaction:
Button is disabled until checkbox is selected.
Click button to go to Profile.

---

SCREEN 3: Participant Profile Page

Purpose:
Collect anonymous participant background information.

Layout:
Centered form card with clean section labels.

Fields:
- Role:
  Dropdown options:
  Medical student, Resident, Physician, Nurse, Pharmacist, Care manager, Other
- Grade or year:
  Text input, placeholder “e.g., M3, PGY-2”
- Clinical experience years:
  Number input
- AI usage frequency:
  Dropdown options:
  Never, Rarely, Monthly, Weekly, Daily
- Prior medical AI use:
  Dropdown options:
  None, Education, Research, Clinical, Other
- Self-rated medical knowledge:
  Radio buttons 1–5
  1 = Not confident, 5 = Very confident

Primary button:
“Continue to Tutorial”

Interaction:
Required fields are Role, AI usage frequency, and Prior medical AI use.
Show inline validation if required fields are missing.

---

SCREEN 4: Tutorial Page

Purpose:
Teach users how to review a case and select claims.

Layout:
Same layout as the experiment screen, but with guided overlays or instruction cards.

Content:
- Top progress indicator:
  “Tutorial”
- Instruction banner:
  “Practice task: Click a claim in the AI output, classify the issue, and submit a sample judgment.”
- Use the same three-column layout:
  Left: Case information
  Center: AI output with clickable claims
  Right: Audit panel

Sample tutorial case:
Patient: 82-year-old female
Context: CKD, knee pain, home care
AI output includes one clearly unsafe claim about NSAID use.

Interaction:
- User can click claims
- Claim selection opens the error form
- Show helper text:
  “Try clicking the highlighted claim.”
- Button:
  “Finish Tutorial and Start Experiment”

---

SCREEN 5: Experiment Case Review Page

This is the most important screen.

Layout:
Three-column layout with a progress bar on top.

Top bar:
- Left: “Case 2 / 9”
- Center: “MedAudit UI”
- Right: Condition badge, for example “Audit UI”
- Do not show a countdown timer.

Main layout:
- Left column: Case Information, 25% width
- Center column: AI Output, 45% width
- Right column: Audit Panel, 30% width

LEFT COLUMN: Case Information

Use a scrollable card titled “Case Information”.

Sections:
1. Patient
   - 84-year-old male
   - Lives alone
   - Home care support
2. Chief Complaint
   - “Fever and reduced oral intake”
3. Present Illness
   - Short paragraph
4. Past History
   - CKD stage 3
   - Heart failure
   - Type 2 diabetes
5. Medications
   - Warfarin 2 mg daily
   - Furosemide 20 mg daily
   - Metformin 500 mg twice daily
6. Allergies
   - No known drug allergies
7. Vitals
   Use a key-value table:
   BP 98/62, HR 112, SpO2 93%, Temp 38.6°C, RR 24
8. Labs
   Cr 1.8 mg/dL, eGFR 32, WBC 14,000
9. Home Care Context
   Short paragraph
10. Multidisciplinary Notes
   - Nurse note
   - Pharmacist note
   - Care manager note

CENTER COLUMN: AI Output

Use a card titled “AI-generated care recommendation”.

Display AI output as a readable paragraph, but each sentence/claim should be an interactive inline claim component.

Sample claims:
1. “The patient likely has a mild viral illness and can be monitored at home.”
2. “Because there is no obvious red flag, urgent evaluation is not required.”
3. “NSAIDs may be used for fever and discomfort.”
4. “The care manager should check whether family support is available.”
5. “Renal function does not need additional attention at this time.”

Claim interaction states:
- Default: normal text
- Hover: subtle blue underline
- Selected: blue outline or blue background tint
- User-marked error: red underline
- User-marked no problem: gray underline

Condition-specific behavior:

Control condition:
- No evidence badges
- No danger highlights
- No missing information alerts

Evidence condition:
- Show small badges next to claims:
  Supported, Unsupported, Contradicted, Not enough info
- Add Evidence Drawer in right panel

Audit condition:
- Show evidence badges
- Highlight unsafe or severe claims with a light red background
- Show severity badge, e.g., “Severity 5”
- Show missing info alerts in amber, e.g., “Missing: renal function review”
- Show Safety Checklist in right panel

RIGHT COLUMN: Audit Panel

Use a card titled “Audit Panel”.

When no claim is selected:
Show empty state:
“Select a claim in the AI output to review it.”

When a claim is selected:
Show:
- Selected claim text
- Error classification form
- Evidence area depending on UI condition
- Safety checklist depending on UI condition

Claim Error Form:
- Dropdown: “What is the issue?”
  Options:
  - No problem
  - Unsupported by case information
  - Contradicts case information
  - Important information omitted
  - Unsafe recommendation
  - Wrong dosage
  - Missing red flag
  - Overgeneralization
  - Unclear expression
  - Other
- Severity radio buttons 1–5
  Label:
  1 Minor, 2 Low, 3 Moderate, 4 Serious, 5 Critical
- Textarea:
  “Why did you classify it this way?”
- Textarea:
  “Suggested correction”
- Slider:
  “Confidence in your judgment” 0–100
- Button:
  “Save claim review”

Evidence Drawer for Evidence and Audit conditions:
Accordion titled “Evidence and rationale”
Inside:
- Label: Unsupported
- Evidence references:
  “Vitals show fever, tachycardia, low blood pressure, and increased respiratory rate.”
  “CKD stage 3 and eGFR 32 are documented.”
- Explanation:
  “This claim may be unsafe because the patient has signs that could indicate systemic infection and renal impairment.”

Safety Checklist for Audit condition:
Card titled “Safety Checklist”
Checkboxes:
- Check vital signs for instability
- Review renal function before recommending medications
- Confirm anticoagulant use
- Check for sepsis red flags
- Consider urgent medical evaluation
- Confirm family or caregiver support

Final Judgment Form:
Located at the bottom of the right column.
Fields:
- “Can this AI output be used as-is?”
  Radio 1–5
  1 = Not usable, 5 = Usable as-is
- “How much do you trust this AI output?”
  Slider 0–100
- “How confident are you in your own review?”
  Slider 0–100
- “Is additional clinical verification needed?”
  Yes / No radio
- “How difficult was this case?”
  Radio 1–5
- “Mental workload”
  Radio 1–7
- Free-text comment
- Submit button:
  “Submit Case Review”

Interaction:
- Submit button disabled until required final judgment fields are filled.
- On click, show confirmation dialog:
  “You cannot edit this answer after submission. Submit this case review?”
- After submit, go to next case or Questionnaire.

---

SCREEN 6: Questionnaire Page

Purpose:
Collect post-study usability and perception data.

Layout:
Centered card with sections.

Questions:
- “The interface was easy to use.” 1–5
- “The interface helped me question the AI output.” 1–5
- “The evidence display was useful.” 1–5
- “The danger highlight was useful.” 1–5
- “The safety checklist was useful.” 1–5
- “I would want to use this kind of interface in a clinical setting.” 1–5
- Free text: “What should be improved?”

Add SUS section:
Title: “System Usability Scale”
Display 10 Likert questions with 1–5 radio buttons.

Button:
“Submit Questionnaire”

---

SCREEN 7: Complete Page

Purpose:
Thank the participant.

Content:
- Header: “Thank you for participating”
- Text:
  “Your responses have been submitted. This research studies how humans can more safely review medical AI outputs.”
- Secondary text:
  “No real patient data was used.”

---

SCREEN 8: Admin Dashboard

Purpose:
Allow researchers to manage cases, AI outputs, annotations, participants, and exports.

Admin navigation:
- Cases
- AI Outputs
- Claims & Annotations
- Participants
- Export

Admin Cases page:
- Table with columns:
  Case title, Domain, Difficulty, Active, Tutorial, AI outputs, Claims, Ground truth errors
- Buttons:
  New Case, Edit, Activate/Deactivate

Admin AI Outputs page:
- Select case
- Add or edit AI output
- Fields:
  Output type, Model name, Prompt version, Text

Admin Claims & Annotations page:
- Left: list of claims
- Right: annotation editor
- Fields:
  Label, Severity, Evidence references, Missing information, Explanation for user
- Ground truth editor:
  Error type, Severity, Explanation, Expected correction, Review status

Admin Participants page:
- Table:
  Participant ID, Role, Status, Progress, Started at, Completed at

Admin Export page:
- Select experiment version
- Select tables
- Toggle “Exclude tutorial data”
- Buttons:
  Export CSV, Export JSON

---

Prototype behavior:
- Use mock data only.
- No real backend is needed for the Figma Make prototype.
- Simulate interactions:
  - Consent checkbox enables the button
  - Profile form continues to tutorial
  - Tutorial continues to experiment
  - Claims are clickable
  - Clicking a claim updates the Audit Panel
  - Submit Case Review moves to next mock case or questionnaire
  - Questionnaire submission moves to Complete
  - Admin tabs switch between pages
- Include at least one example for each condition:
  Control UI, Evidence UI, and Audit UI.
- Make the Audit UI visually distinct by showing evidence badges, red danger highlights, amber missing information alerts, and a safety checklist.

Data to use in prototype:
Create 3 mock cases:
1. CKD patient with unsafe NSAID recommendation
2. Anticoagulated elderly patient after a fall with missing head injury red flag
3. Heart failure patient with weight gain and dyspnea where urgent evaluation is underemphasized

Design constraints:
- Keep text readable and realistic.
- Use compact but not crowded layouts.
- The experiment screen must feel usable for 30–40 minutes of repeated case review.
- Avoid flashy visuals.
- Use professional medical UI patterns.
- Make the prototype polished enough to show to a professor and research collaborators.