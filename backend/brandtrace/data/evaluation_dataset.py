import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class EvaluationSample(BaseModel):
    id: str
    title: str
    org_id: str
    workspace_id: str
    channel: str
    content: str
    expected_violation: bool
    expected_defect_type: str
    expected_rule_citations: List[str]
    description: str

class BenchmarkResult(BaseModel):
    sample_id: str
    title: str
    org_id: str
    expected_violation: bool
    predicted_violation: bool
    is_correct: bool
    outcome: str # "TP", "TN", "FP", "FN"
    risk_score: float
    governance_decision: str
    detected_citations: List[str]
    processing_time_ms: float

class EvaluationMetrics(BaseModel):
    total_samples: int
    true_positives: int
    true_negatives: int
    false_positives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float
    accuracy: float
    samples_per_organization: Dict[str, int]
    sample_results: List[BenchmarkResult]

# ==============================================================================
# EMPIRICAL EVALUATION DATASET: 22 REALISTIC LABELLED SAMPLES (AURELLE, APEX, NOVUS)
# ==============================================================================

EVALUATION_DATASET: List[EvaluationSample] = [
    # --------------------------------------------------------------------------
    # 1. ORG-AURELLE (Consumer Tech Enterprise) — 11 Samples
    # --------------------------------------------------------------------------
    EvaluationSample(
        id="EVAL-AUR-01",
        title="Aurelle Studio Subscription Ad — Outdated Price",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Digital Web Banner",
        content="Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹499 per month. Real-time audio rendering included.",
        expected_violation=True,
        expected_defect_type="PRICING_OUTDATED",
        expected_rule_citations=["FACT-AUR-PRC-01"],
        description="References superseded price of ₹499 instead of current approved price ₹599."
    ),
    EvaluationSample(
        id="EVAL-AUR-02",
        title="Aurelle Pulse Smart Ring Durability Claim",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Print Lookbook",
        content="Crafted from proprietary forged elements, the Aurelle Pulse Smart Ring is 100% unbreakable and completely indestructible under any conditions.",
        expected_violation=True,
        expected_defect_type="UNSUBSTANTIATED_SUPERLATIVE",
        expected_rule_citations=["FTC Policy Statement / ASTM B265"],
        description="Unsubstantiated absolute claim of unbreakability on consumer hardware."
    ),
    EvaluationSample(
        id="EVAL-AUR-03",
        title="Aurelle Founder Launch Promotion Campaign",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Email Newsletter",
        content="Exclusive invitation: Claim your Founder Launch Trial ₹0 subscription today and experience our spatial audio suite with zero upfront fee.",
        expected_violation=True,
        expected_defect_type="EXPIRED_PROMOTION",
        expected_rule_citations=["FACT-AUR-EXP-01"],
        description="Promotional fact lapsed on December 31, 2025; content is invalid."
    ),
    EvaluationSample(
        id="EVAL-AUR-04",
        title="Aurelle Pulse Medical Diagnostic Claim",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="E-Commerce Product Page",
        content="Aurelle Pulse Smart Ring: The world's first wearable that provides a medical-grade diagnostic cure for cardiovascular heart disease.",
        expected_violation=True,
        expected_defect_type="REGULATORY_FDA_CLASS_II",
        expected_rule_citations=["GL-AUR-03 / FDA 21 CFR §870"],
        description="Wellness device claiming to be an approved medical diagnostic cure."
    ),
    EvaluationSample(
        id="EVAL-AUR-05",
        title="Aurelle Horizon Audio Battery Claim — Missing Footnote",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Social Media Post",
        content="Experience sound without boundary. Aurelle Horizon Headphones deliver 72-hour battery life with active noise cancellation enabled.",
        expected_violation=True,
        expected_defect_type="MISSING_DISCLOSURE_FOOTNOTE",
        expected_rule_citations=["GL-AUR-04 / IEC 62133"],
        description="72-hour battery life lacks mandatory standardized lab protocol disclosure."
    ),
    EvaluationSample(
        id="EVAL-AUR-06",
        title="Aurelle Horizon Trademark Casing & Misspelling",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Affiliate Marketing Kit",
        content="Order the new Aurelle Horizun Spatial Headphones with QuantumAcoustics audio engine today.",
        expected_violation=True,
        expected_defect_type="TRADEMARK_DEFECT",
        expected_rule_citations=["TM-AUR-01", "TM-AUR-02"],
        description="Contains misspelled trademark 'Aurelle Horizun' and missing ™ mark."
    ),
    EvaluationSample(
        id="EVAL-AUR-07",
        title="Aurelle OOH Billboard Design — Forbidden Neon Orange",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Out-of-Home Billboard",
        content="Aurelle Maison Spring Collection spotlight in Neon Orange #FF5500 background canvas with gold trim.",
        expected_violation=True,
        expected_defect_type="OFF_PALETTE_COLOR",
        expected_rule_citations=["GL-AUR-02"],
        description="Uses unauthorized garish hue #FF5500 violating master palette."
    ),
    EvaluationSample(
        id="EVAL-AUR-08",
        title="Aurelle Packaging Layout — Logo Clearance Defect",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Retail Packaging Spec",
        content="Retail packaging box face with 12px padding clearance around the Aurelle wordmark.",
        expected_violation=True,
        expected_defect_type="LOGO_CLEARANCE_VIOLATION",
        expected_rule_citations=["GL-AUR-01"],
        description="12px clearance violates mandatory minimum safe-zone threshold of 20px."
    ),
    EvaluationSample(
        id="EVAL-AUR-09",
        title="Aurelle Web Layout — WCAG Contrast Failure",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Web Landing Page",
        content="Website footer containing low-contrast #777777 body text on #333333 dark slate background (contrast ratio 2.3:1).",
        expected_violation=True,
        expected_defect_type="ACCESSIBILITY_WCAG_FAILURE",
        expected_rule_citations=["GL-AUR-07 / WCAG 2.1 AA"],
        description="2.3:1 contrast fails WCAG 2.1 Level AA minimum 4.5:1 ratio."
    ),
    EvaluationSample(
        id="EVAL-AUR-10",
        title="Aurelle Editorial Spec — Conflicting Helvetica Font",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Regional Brand Guide",
        content="Regional branch brand guideline requiring typography in Helvetica Neue for primary luxury hero titles.",
        expected_violation=True,
        expected_defect_type="TYPOGRAPHY_CONFLICT",
        expected_rule_citations=["GL-AUR-06"],
        description="Conflicts with master global guideline mandating Editorial Serif."
    ),
    EvaluationSample(
        id="EVAL-AUR-11",
        title="Aurelle Horizon Compliant Product Release (Control)",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Press Release",
        content="Aurelle Horizon™ Spatial Headphones feature our custom acoustic drivers and active noise cancellation. Available now starting at ₹599 per month for Aurelle Cloud Studio members.",
        expected_violation=False,
        expected_defect_type="NONE_COMPLIANT",
        expected_rule_citations=[],
        description="Clean compliant control with correct trademark, price, and tone."
    ),
    EvaluationSample(
        id="EVAL-AUR-12",
        title="Aurelle Pulse Smart Ring Compliant Overview (Control)",
        org_id="ORG-AURELLE",
        workspace_id="aurelle-tech",
        channel="Product Brochure",
        content="Aurelle Pulse™ is a consumer biometric wellness monitor engineered with Grade 5 Aerospace Titanium. Designed for continuous daily lifestyle and recovery insights.",
        expected_violation=False,
        expected_defect_type="NONE_COMPLIANT",
        expected_rule_citations=[],
        description="Clean compliant control without diagnostic medical claims."
    ),

    # --------------------------------------------------------------------------
    # 2. ORG-APEX (Electric Mobility & Autonomous Transport) — 7 Samples
    # --------------------------------------------------------------------------
    EvaluationSample(
        id="EVAL-APX-01",
        title="Apex GT Range Exaggeration",
        org_id="ORG-APEX",
        workspace_id="apex-dynamics",
        channel="Social Ad",
        content="Go further than any EV in history. The Apex GT delivers over 650 miles on a single charge with zero compromises.",
        expected_violation=True,
        expected_defect_type="CLAIM_CONTRADICTED",
        expected_rule_citations=["AC-01 / EPA EV-APX-982"],
        description="Claims 650 miles contradicting certified max range of 520 miles."
    ),
    EvaluationSample(
        id="EVAL-APX-02",
        title="Apex GT Ultra-Fast Charging Overstatement",
        org_id="ORG-APEX",
        workspace_id="apex-dynamics",
        channel="Digital Banner",
        content="Stop wasting time at chargers. Plug in and get a full 100% charge in 8 minutes flat at any station.",
        expected_violation=True,
        expected_defect_type="CLAIM_UNSUBSTANTIATED",
        expected_rule_citations=["AC-02 / AP-LAB-884-C"],
        description="8-minute full charge contradicts verified 10-80% in 14-minute protocol."
    ),
    EvaluationSample(
        id="EVAL-APX-03",
        title="Apex Dynamics Greenwashing Blanket Superlative",
        org_id="ORG-APEX",
        workspace_id="apex-dynamics",
        channel="Print Magazine",
        content="Drive the future of guilt-free motoring. The Apex GT is 100% eco-friendly with a certified zero-carbon footprint across all operations.",
        expected_violation=True,
        expected_defect_type="REGULATORY_GREENWASHING",
        expected_rule_citations=["REG-01 / FTC Green Guides §260.4"],
        description="Unqualified blanket environmental claims trigger statutory FTC sanctions."
    ),
    EvaluationSample(
        id="EVAL-APX-04",
        title="Apex Autonomous Driving Marketing Deception",
        org_id="ORG-APEX",
        workspace_id="apex-dynamics",
        channel="Video Voiceover",
        content="Introducing HyperDrive: fully autonomous hands-free without looking driving so you can sleep while you commute to work.",
        expected_violation=True,
        expected_defect_type="REGULATORY_SAFETY_NHTSA",
        expected_rule_citations=["REG-03 / NHTSA SGO 2021-01"],
        description="Hands-free sleep claim on SAE Level 2 vehicle triggers immediate federal investigation."
    ),
    EvaluationSample(
        id="EVAL-APX-05",
        title="Apex Supercar Comparative False Advertising",
        org_id="ORG-APEX",
        workspace_id="apex-dynamics",
        channel="Paid Search Headline",
        content="The world's fastest supercar destroys all competitors with insane track acceleration.",
        expected_violation=True,
        expected_defect_type="COMPARATIVE_FALSE_ADVERTISING",
        expected_rule_citations=["Lanham Act §43(a) / TONE-01"],
        description="Unsubstantiated absolute superlative and informal hype vocabulary."
    ),
    EvaluationSample(
        id="EVAL-APX-06",
        title="Apex GT Verified Compliant Specification Sheet (Control)",
        org_id="ORG-APEX",
        workspace_id="apex-dynamics",
        channel="Technical Whitepaper",
        content="The Apex GT achieves up to 520 miles EPA-estimated range powered by QuantumCell™ 800V Architecture. Ultra-fast DC charging replenishes 10% to 80% capacity in 14 minutes at 350kW.",
        expected_violation=False,
        expected_defect_type="NONE_COMPLIANT",
        expected_rule_citations=[],
        description="Clean compliant control with valid EPA qualifiers, proper trademarks, and verified metrics."
    ),
    EvaluationSample(
        id="EVAL-APX-07",
        title="Apex HyperDrive Driver-Assistance Advisory (Control)",
        org_id="ORG-APEX",
        workspace_id="apex-dynamics",
        channel="Owner Handbook",
        content="HyperDrive OS® provides advanced driver-assistance capabilities designed for highway driving. Attentive driver supervision is required at all times.",
        expected_violation=False,
        expected_defect_type="NONE_COMPLIANT",
        expected_rule_citations=[],
        description="Clean compliant control with statutory driver supervision disclosure."
    ),

    # --------------------------------------------------------------------------
    # 3. ORG-NOVUS (Regulated Life Sciences & Therapeutics) — 4 Samples
    # --------------------------------------------------------------------------
    EvaluationSample(
        id="EVAL-NOV-01",
        title="Novus CardioShield Unapproved Cure Claim",
        org_id="ORG-NOVUS",
        workspace_id="novus-health",
        channel="Patient Advocacy Brochure",
        content="Take control of cardiovascular health. CardioShield completely cures hypertension in 14 days without invasive surgery.",
        expected_violation=True,
        expected_defect_type="REGULATORY_FDA_DRUG_CURE",
        expected_rule_citations=["FDA 21 CFR §201.57 / §202.1"],
        description="Prescription small molecule claiming an absolute cure violates FDA drug advertising law."
    ),
    EvaluationSample(
        id="EVAL-NOV-02",
        title="Novus CardioShield Omission of Fair Balance Risk Warning",
        org_id="ORG-NOVUS",
        workspace_id="novus-health",
        channel="Digital Web Display Ad",
        content="Discover daily peace of mind. CardioShield has zero side effects and provides total cardiovascular protection.",
        expected_violation=True,
        expected_defect_type="REGULATORY_FDA_FAIR_BALANCE",
        expected_rule_citations=["FDA 21 CFR §202.1 Fair Balance"],
        description="Zero side effects claim omits mandatory risk disclosures and black-box warning."
    ),
    EvaluationSample(
        id="EVAL-NOV-03",
        title="Novus Care Expired Patient Assistance Program",
        org_id="ORG-NOVUS",
        workspace_id="novus-health",
        channel="Hospital Co-Pay Flyer",
        content="Enroll today in the Novus Care 2024 zero-copay program for immediate prescription pharmacy reimbursement.",
        expected_violation=True,
        expected_defect_type="EXPIRED_PATIENT_PROGRAM",
        expected_rule_citations=["Novus Market Access Directive 2024-EXP"],
        description="References expired 2024 co-pay program that lapsed December 31, 2024."
    ),
    EvaluationSample(
        id="EVAL-NOV-04",
        title="Novus Clinical Trial Abstract (Control)",
        org_id="ORG-NOVUS",
        workspace_id="novus-health",
        channel="Medical Journal Abstract",
        content="CardioShield™ demonstrated statistically significant ApoB reduction in double-blind phase 3 clinical trial NCT-049281. Consult your healthcare physician regarding potential risks.",
        expected_violation=False,
        expected_defect_type="NONE_COMPLIANT",
        expected_rule_citations=[],
        description="Clean compliant control with clinical trial citation and physician disclaimer."
    )
]

# ==============================================================================
# RIGOROUS BENCHMARK RUNNER & METRICS CALCULATOR
# ==============================================================================

def execute_empirical_benchmark(pipeline, bkg_loader_func) -> EvaluationMetrics:
    """
    Executes all 22 labelled evaluation samples against the actual BrandTrace AI pipeline.
    Computes true positives, true negatives, false positives, false negatives,
    Precision, Recall, F1-Score, and Accuracy without hardcoding or fabrication.
    """
    sample_results: List[BenchmarkResult] = []
    tp = 0
    tn = 0
    fp = 0
    fn = 0
    org_counts: Dict[str, int] = {}

    for sample in EVALUATION_DATASET:
        t0 = time.time()
        org_counts[sample.org_id] = org_counts.get(sample.org_id, 0) + 1
        
        # Load knowledge graph for workspace
        bkg = bkg_loader_func(sample.workspace_id)

        # Run verification
        from brandtrace.agents.schema import VerificationRequest
        req = VerificationRequest(
            brand_id=sample.workspace_id,
            asset_title=sample.title,
            channel=sample.channel,
            content=sample.content
        )
        res = pipeline.verify_asset(req, bkg)
        t_elapsed_ms = round((time.time() - t0) * 1000.0, 2)

        # Ground truth vs predicted violation
        predicted_violation = (
            res.composite_risk_score >= 20.0 or
            len(res.all_risk_spans) > 0 or
            res.governance_decision != "APPROVED_FOR_RELEASE"
        )

        detected_cits = [span.rule_citation for span in res.all_risk_spans]

        if sample.expected_violation and predicted_violation:
            outcome = "TP"
            tp += 1
            is_correct = True
        elif not sample.expected_violation and not predicted_violation:
            outcome = "TN"
            tn += 1
            is_correct = True
        elif not sample.expected_violation and predicted_violation:
            outcome = "FP"
            fp += 1
            is_correct = False
        else: # expected_violation and not predicted_violation
            outcome = "FN"
            fn += 1
            is_correct = False

        sample_results.append(BenchmarkResult(
            sample_id=sample.id,
            title=sample.title,
            org_id=sample.org_id,
            expected_violation=sample.expected_violation,
            predicted_violation=predicted_violation,
            is_correct=is_correct,
            outcome=outcome,
            risk_score=res.composite_risk_score,
            governance_decision=res.governance_decision,
            detected_citations=detected_cits,
            processing_time_ms=t_elapsed_ms
        ))

    total = len(EVALUATION_DATASET)
    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 1.0
    recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 1.0
    f1 = round(2.0 * (precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 0.0
    accuracy = round((tp + tn) / total, 4) if total > 0 else 0.0

    return EvaluationMetrics(
        total_samples=total,
        true_positives=tp,
        true_negatives=tn,
        false_positives=fp,
        false_negatives=fn,
        precision=precision,
        recall=recall,
        f1_score=f1,
        accuracy=accuracy,
        samples_per_organization=org_counts,
        sample_results=sample_results
    )
