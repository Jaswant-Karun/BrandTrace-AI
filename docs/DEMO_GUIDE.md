# BRANDTRACE AI — Evaluator Demonstration Guide 🧭

> **Target Audience:** Hackathon Evaluators, Enterprise Product Judges & Security Reviewers  
> **Live Web Application:** [https://brandtrace.vercel.app](https://brandtrace.vercel.app)  
> **Backend Service:** [https://brandtrace-backend.onrender.com](https://brandtrace-backend.onrender.com)

---

## 1. Quick-Start Demo Credentials

Evaluators can immediately experience BRANDTRACE AI using the dedicated restricted demonstration account:

| Attribute | Credential / Setting |
|---|---|
| **Login URL** | [https://brandtrace.vercel.app/login](https://brandtrace.vercel.app/login) |
| **Email** | `demo@brandtrace.ai` |
| **Password** | `DemoAurelle2026!` |
| **Persona Name** | Alex Mercer (VP Brand Governance) |
| **Assigned Role** | `BRAND_MANAGER` |
| **Assigned Workspace** | `aurelle-tech` (Aurelle Consumer Hardware & Cloud Studio) |
| **Data Scope** | Synthetic demonstration records (clearly marked) |

> [!NOTE]
> **One-Click Persona Switcher:** The login page also provides a one-click demo pill: *"Explore the BrandTrace AI Demo"*. Clicking it automatically populates the credentials and logs in directly.

---

## 2. Recommended 8-Step Evaluator Journey

### Step 1: Login & Command Center Overview
1. Navigate to [https://brandtrace.vercel.app/login](https://brandtrace.vercel.app/login).
2. Enter `demo@brandtrace.ai` and `DemoAurelle2026!` (or click the demonstration button).
3. Land on the **Command Center** dashboard:
   - Review live enterprise governance metrics: **94.2% Compliance Rate**, active campaigns, and real-time risk distribution.
   - Note the top status bar verifying the active tenant: `Aurelle Tech` (`ORG-AURELLE`).

### Step 2: Explore Brand Knowledge Base
1. Click **Brand Knowledge Base** in the left sidebar.
2. Search for `Cloud Studio` to view the approved pricing record: `FACT-AUR-PRC-01` (`₹499/month`).
3. Notice the evidentiary citation: *"Aurelle Commercial Price Sheet Rev 4.1"*, department owner, effective dates, and restricted terminology.
4. Try adding a test fact using **Add Approved Fact** — notice server-side validation and persistence.

### Step 3: Interactive BDIG Knowledge Graph
1. Navigate to **Brand Knowledge Graph**.
2. An interactive directed canvas powered by `@xyflow/react` displays all connected nodes: Guidelines, Facts, Claims, Campaigns, and Assets.
3. Click on node `FACT-AUR-PRC-01` (`₹499/month`) to highlight upstream guidelines and downstream marketing assets.
4. Observe the animated bezier edges illustrating direct commercial dependencies.

### Step 4: Content Studio — Multi-Agent Inspection
1. Navigate to **Content Studio**.
2. **Test Clean Content:**
   - Channel: `Instagram / Meta Feed Ads`
   - Paste: `"Scale your creative workflows with Aurelle Cloud Studio. Spatial audio mastering starting at just ₹499/month."`
   - Click **Run Inspection**.
   - Result: `APPROVED_FOR_RELEASE` (Risk Score: `0.0`, all agents green).
3. **Test Violation Content (Statutory Medical Claim):**
   - Paste: `"Aurelle Pulse Smart Ring is a medical-grade diagnostic cure that eliminates all symptoms of cardiovascular disease."`
   - Click **Run Inspection**.
   - Result: `REJECTED_GATED` (Risk Score: `35.0+`, Critical Regulatory Flag: FDA 21 CFR §870 Wellness Device Classification violation).

### Step 5: Token-Level Risk Spans & One-Click Remediation
1. Inspect the highlighted red token spans in the inspector view.
2. Click the span to open the **Evidence Reference Drawer**.
3. View the **Autonomous Remediation** panel proposing compliant alternative copy:
   - Remediated: *"Aurelle Pulse Smart Ring tracks heart rate trends to support your daily wellness journey."*
4. Click **Apply Remediation** to update the copy instantly.

### Step 6: Change Impact Simulator (Digital Twin)
1. Navigate to **Change Impact Simulator**.
2. Select target fact: `FACT-AUR-PRC-01` (`₹499`).
3. Propose price update: `₹499` $\to$ `₹599`.
4. Click **Run Impact Simulation**:
   - The Digital Twin projects a **87.5% Blast Radius Risk**.
   - Identifies 4 active marketing touchpoints that would display contradictory pricing.
   - Displays estimated review workload: **14.5 hours across 3 departments**.
5. Observe that the approved catalog price remains **₹499** until a human manager authorizes the commit.

### Step 7: Human Approval Center
1. Navigate to **Approval Center**.
2. Review the pending revision task: *"Update Spatial Audio Commercial Pricing to ₹599"*.
3. Add reviewer notes: *"Commercial master update to ₹599 verified and sealed."*
4. Click **Approve & Seal** — state transitions atomically to `APPROVED_SEALED`.

### Step 8: Cryptographic Trust Ledger Verification
1. Navigate to **Audit & Trust Center**.
2. View the immutable release ledger containing cryptographic SHA-256 seals.
3. Open the **Release Integrity Verifier**:
   - Test original approved content $\to$ Returns `VALID_UNCHANGED` (Green Seal Verified).
   - Test modified copy (e.g. change ₹599 to ₹399) $\to$ Returns `MODIFIED_AFTER_APPROVAL` (Tamper Detected).
   - Test historical copy $\to$ Returns `SUPERSEDED`.
   - Test recalled copy $\to$ Returns `REVOKED`.

---

## 3. Safe Demo Workspace Reset

Evaluators can reset the demonstration workspace at any time to return all records to pristine condition:
1. In the bottom-left sidebar or in **Settings & Security**, click **Reset Demo Workspace**.
2. Confirm the prompt.
3. All simulated price changes, draft tasks, and test facts are purged, and the factory state is restored.
4. Production settings and other tenants remain strictly isolated and unaffected.

