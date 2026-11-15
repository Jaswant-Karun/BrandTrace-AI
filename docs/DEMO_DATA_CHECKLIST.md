# BRANDTRACE AI — Evaluator & Judge Demo Data Checklist 📋

> **Target Audience:** Hackathon Judges, QA Evaluators, and Demonstrators  
> **Tagline:** *Detect. Predict. Verify. Prevent.*  
> **Workspace Context:** `aurelle-tech` (Aurelle Consumer Hardware & Cloud Studio)

---

## 1. Approved Brand Facts & Guidelines Truth-Set

| Record ID | Type | Label | Current Approved Value | Evidence Citation / Source |
| :--- | :--- | :--- | :--- | :--- |
| `FACT-AUR-PRC-01` | `PRICE` | Aurelle Cloud Studio Subscription | `₹499/mo` | *Aurelle Global Commercial Rate Card Rev 4.1* |
| `FACT-AUR-BAT-01` | `SPECIFICATION` | Horizon Watch Continuous Battery Life | `72 Hours` | *IEC 62133 Continuous Stress Test Protocol* |
| `FACT-AUR-AUD-01` | `SPECIFICATION` | QuantumAcoustics™ Audio Resolution | `192kHz / 24-bit` | *Aurelle Acoustics Lab Spatial Audio Standard* |
| `GL-AUR-03` | `REGULATORY` | Non-Diagnostic Wellness Rule | Strict non-medical | *FDA 21 CFR §870 Wellness Device Classification* |
| `GL-AUR-05` | `TRADEMARK` | QuantumAcoustics™ Trademark Policy | Mandatory `™` symbol | *USPTO Reg. #6,892,104 / Lanham Act §43(a)* |

---

## 2. Digital Twin Change Simulation Inputs & Expected Outputs

### Simulation Target:
- **Target Fact ID:** `FACT-AUR-PRC-01`
- **Target Record Type:** `PRICE`
- **Current Value:** `₹499/mo`
- **Proposed Value:** `₹599/mo`
- **Change Rationale:** *"Semi-annual commercial pricing index adjustment covering global spatial audio mastering infrastructure costs."*
- **Proposed By:** *Alex Mercer, VP Global Brand Governance*

### Expected Simulation Outputs:
- **Affected Touchpoints Count:** **4 Live Assets**
  1. `AST-AUR-AD-02` — *Meta Feed Ad: Cloud Studio at ₹499/mo*
  2. `AST-AUR-AD-03` — *Google PPC Ad: Cloud Studio from ₹499*
  3. `AST-AUR-WEB-01` — *Aurelle Cloud Studio Pricing & Checkout Page*
  4. `AST-AUR-DOC-01` — *B2B Enterprise Rate Card & Licensing PDF*
- **Financial Risk Exposure:** **$320,000** (cumulative in-flight campaign budget at risk of statutory price claim mismatch).
- **Estimated Review Hours:** **12.5 Departmental Hours** (distributed across Creative, Legal, and Media Operations).
- **Non-Destructive Guarantee:** Production data in MongoDB Atlas remains `₹499/mo` until explicitly authorized and committed through the human gate.

---

## 3. Sample Content for AI Multi-Agent Inspection

### Case 1: Commercial Pricing & Trademark Defects (Explainable Risk Spans)
- **Asset Title:** `Spring 2026 Fleet Social Ad`
- **Channel:** `Social Media / Digital Ads`
- **Input Content:**
  ```text
  Experience the revolutionary Aurelle Horizun Watch with QuantumAcoustics spatial sound streaming. Aurelle Cloud Studio subscription is ₹499/mo with 72-hour battery life.
  ```
- **Expected Inspection Outcome:**
  - Status: `CHANGES_REQUESTED` (Risk Score: `25.0`)
  - **VoicePersonaAgent:** Flags typo `"Horizun"` (should be `"Horizon"`).
  - **ClaimSubstantiationAgent:** Substantiates `₹499/mo` price against `FACT-AUR-PRC-01` and `72-hour` battery against `FACT-AUR-BAT-01`.
  - **RegulatoryComplianceAgent:** Flags missing trademark symbol `™` on `"QuantumAcoustics"` citing *Lanham Act §43(a)*.
  - **Latency:** **<300ms**

### Case 2: Critical Regulatory Violation (Instant Gate Rejection)
- **Asset Title:** `Pulse Smart Ring Diagnostic Cure Claim`
- **Channel:** `Social Media / Meta Feed`
- **Input Content:**
  ```text
  Aurelle Pulse Smart Ring is a medical-grade diagnostic cure that eliminates all symptoms of cardiovascular disease.
  ```
- **Expected Inspection Outcome:**
  - Status: `REJECTED_GATED` (Risk Score: `35.0+`)
  - **RegulatoryComplianceAgent:** Flags critical statutory violation: *FDA 21 CFR §870 Non-Diagnostic Wellness Device Classification* (consumer wearables cannot claim disease cure or medical diagnostic capability).
  - **Action:** Gated from release; requires complete copy overhaul.

---

## 4. Public Verification Portal Verification Test Data

### A. Authentic Issued Seal Code Verification
- **Input Seal Code:** `BT-SEAL-8F3A2B1C`
- **Expected Status:** `APPROVED` (Green Status Badge)
- **Ledger State:** `VALID_UNCHANGED`
- **Verified Details:** Brand: *Apex Dynamics* | Asset: *Apex Fleet Ultra-Fast Charging Protocol* | Approved Version: `v1.0` | Cryptographic Scheme: *SHA-256 Tamper-Evident Ledger Digest (Internal Merkle-Style Chaining)*

### B. Unknown / Fabricated Seal Code Verification
- **Input Seal Code:** `BT-SEAL-UNKNOWN999`
- **Expected Status:** `UNKNOWN` (Gray Status Badge)
- **Ledger State:** `UNKNOWN_RECORD`
- **Explanation:** *"No matching seal code exists in the official BrandTrace release ledger."*

### C. Authentic Approved Text Verification
- **Input Text:**
  ```text
  Apex Dynamics operates high-performance commercial EV charging infrastructure strictly under 65 degrees Celsius.
  ```
- **Expected Status:** `APPROVED` (Green Status Badge)
- **Ledger State:** `VALID_UNCHANGED`
- **Canonical Behavior:** Whitespace differences and smart quotation marks (`“ ” ‘ ’`) are normalized without breaking verification.

### D. Modified Text After Approval (Tampering Detection)
- **Input Seal Code:** `BT-SEAL-8F3A2B1C`
- **Input Text (Altered):**
  ```text
  Apex Dynamics operates high-performance commercial EV charging infrastructure strictly under 45 degrees Celsius with 99% guaranteed uptime.
  ```
- **Expected Status:** `MODIFIED` (Red Status Badge)
- **Ledger State:** `MODIFIED_AFTER_APPROVAL`
- **Explanation:** *"Content hash differs from the approved cryptographic release ledger record."*

### E. Unknown / Unregistered Text Verification
- **Input Text:**
  ```text
  Unregistered random promotional copy not registered in any corporate release ledger.
  ```
- **Expected Status:** `UNKNOWN` (Gray Status Badge)
- **Ledger State:** `UNKNOWN_RECORD`
