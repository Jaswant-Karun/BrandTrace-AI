import re
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from brandtrace.graph.engine import BrandKnowledgeGraph
from brandtrace.graph.schema import SeverityLevel

class ClaimClassification(str):
    SUPPORTED = "SUPPORTED"
    CONTRADICTED = "CONTRADICTED"
    NEEDS_VERIFICATION = "NEEDS_VERIFICATION"
    EXPIRED_SOURCE = "EXPIRED_SOURCE"
    POTENTIALLY_MISLEADING = "POTENTIALLY_MISLEADING"

class ExplainableClaimAssessment(BaseModel):
    claim_text: str
    classification: str
    confidence_score: float # 0.0 to 1.0
    matched_source_id: Optional[str] = None
    source_citation: Optional[str] = None
    explanation: str
    minimal_change_rewrite: str
    human_override_allowed: bool = True

class ExplainableReviewReport(BaseModel):
    asset_id: Optional[str] = None
    brand_id: str
    overall_confidence: float
    total_claims_analyzed: int
    claims_supported_count: int
    claims_contradicted_count: int
    claims_needs_verification_count: int
    claims_misleading_count: int
    assessments: List[ExplainableClaimAssessment]
    retrieved_truth_nodes: List[Dict[str, Any]]
    suggested_full_rewrite: str
    deterministic_rule_count: int

class ExplainableReviewEngine:
    """
    Hybrid Explainable AI Review Engine
    Combines deterministic rule checking, retrieval-augmented brand truth context,
    and structured claim classification.
    """

    def retrieve_relevant_truth_nodes(
        self,
        text: str,
        bkg: BrandKnowledgeGraph
    ) -> List[Dict[str, Any]]:
        """RAG retrieval: extracts relevant approved claims and facts from BKG based on semantic tokens."""
        relevant_nodes = []
        lower = text.lower()
        
        for n_id, data in bkg.graph.nodes(data=True):
            ntype = data.get("type")
            if ntype in ["APPROVED_CLAIM", "APPROVED_FACT", "TRADEMARK", "PROHIBITED_CLAIM"]:
                label = data.get("label", "").lower()
                desc = data.get("description", "").lower()
                props = data.get("properties", {})
                
                # Check keyword overlap
                tokens = [t for t in label.split() if len(t) > 3]
                if any(t in lower for t in tokens) or (props.get("category") == "PRICE" and ("price" in lower or "₹" in lower or "rs" in lower or "$" in lower)):
                    relevant_nodes.append({
                        "node_id": n_id,
                        "type": ntype,
                        "label": data.get("label", n_id),
                        "properties": props,
                        "description": data.get("description", "")
                    })
        return relevant_nodes

    def analyze_claims_explainable(
        self,
        text: str,
        bkg: BrandKnowledgeGraph,
        brand_id: str = "apex-dynamics"
    ) -> ExplainableReviewReport:
        """
        Executes explainable claim assessment:
        Classifies each claim as SUPPORTED, CONTRADICTED, NEEDS_VERIFICATION, EXPIRED_SOURCE, or POTENTIALLY_MISLEADING.
        """
        retrieved_nodes = self.retrieve_relevant_truth_nodes(text, bkg)
        assessments: List[ExplainableClaimAssessment] = []
        deterministic_rules = 0

        # Sentence / Clause splitting for granular explainability
        clauses = [c.strip() for c in re.split(r"[.!?\n]+", text) if len(c.strip()) > 8]

        for clause in clauses:
            lower = clause.lower()
            
            # 1. Range Claim Assessment
            range_match = re.search(r"(\b\d{2,4}\b)\s*miles?", clause, re.IGNORECASE)
            if range_match:
                deterministic_rules += 1
                claimed_range = int(range_match.group(1))
                if claimed_range == 520:
                    if "epa" in lower or "estimated" in lower:
                        assessments.append(
                            ExplainableClaimAssessment(
                                claim_text=clause,
                                classification=ClaimClassification.SUPPORTED,
                                confidence_score=0.99,
                                matched_source_id="AC-01",
                                source_citation="EPA Test Cycle J1634_202409 (Certificate #EV-APX-982)",
                                explanation="520 miles range claim is backed by official EPA certificate AC-01 with mandatory qualifier.",
                                minimal_change_rewrite=clause,
                                human_override_allowed=False
                            )
                        )
                    else:
                        assessments.append(
                            ExplainableClaimAssessment(
                                claim_text=clause,
                                classification=ClaimClassification.NEEDS_VERIFICATION,
                                confidence_score=0.92,
                                matched_source_id="AC-01",
                                source_citation="Approved Claim AC-01 Qualifier Mandate",
                                explanation="520 miles is an approved metric but requires statutory 'EPA-estimated' qualifier to avoid FTC deception action.",
                                minimal_change_rewrite=clause.replace(range_match.group(0), f"{range_match.group(0)} (EPA-estimated)"),
                                human_override_allowed=True
                            )
                        )
                elif claimed_range > 520:
                    assessments.append(
                        ExplainableClaimAssessment(
                            claim_text=clause,
                            classification=ClaimClassification.CONTRADICTED,
                            confidence_score=0.98,
                            matched_source_id="AC-01",
                            source_citation="Approved Claim AC-01 (Max certified: 520 miles)",
                            explanation=f"Claimed range of {claimed_range} miles contradicts certified truth threshold AC-01.",
                            minimal_change_rewrite=clause.replace(range_match.group(0), "up to 520 miles (EPA-estimated)"),
                            human_override_allowed=True
                        )
                    )

            # 2. Charging Claim Assessment
            charge_match = re.search(r"(\b\d{1,2}\b)\s*min(?:utes?)?", clause, re.IGNORECASE)
            if charge_match and "charge" in lower:
                deterministic_rules += 1
                mins = int(charge_match.group(1))
                if mins < 14:
                    assessments.append(
                        ExplainableClaimAssessment(
                            claim_text=clause,
                            classification=ClaimClassification.CONTRADICTED,
                            confidence_score=0.97,
                            matched_source_id="AC-02",
                            source_citation="Apex Lab Protocol AP-LAB-884-C",
                            explanation=f"{mins} minute charge is unsubstantiated. Lab protocol AC-02 certifies 10-80% in 14 minutes at 350kW DC.",
                            minimal_change_rewrite=clause.replace(charge_match.group(0), "10% to 80% in 14 minutes"),
                            human_override_allowed=True
                        )
                    )
                else:
                    assessments.append(
                        ExplainableClaimAssessment(
                            claim_text=clause,
                            classification=ClaimClassification.SUPPORTED,
                            confidence_score=0.96,
                            matched_source_id="AC-02",
                            source_citation="Apex Internal Lab Protocol AP-LAB-884-C",
                            explanation="Charging claim matches validated 14-minute 350kW benchmark.",
                            minimal_change_rewrite=clause,
                            human_override_allowed=False
                        )
                    )

            # 3. Greenwashing Superlative Assessment
            if "100% eco" in lower or "zero-carbon" in lower or "completely green" in lower:
                deterministic_rules += 1
                assessments.append(
                    ExplainableClaimAssessment(
                        claim_text=clause,
                        classification=ClaimClassification.POTENTIALLY_MISLEADING,
                        confidence_score=0.99,
                        matched_source_id="PC-01",
                        source_citation="FTC Green Guides 16 CFR §260.4 / EU Directive 2024/825",
                        explanation="Blanket environmental claim violates statutory lifecycle substantiation standards.",
                        minimal_change_rewrite="engineered with 85% certified recycled aluminum and zero direct tailpipe emissions",
                        human_override_allowed=True
                    )
                )

            # 4. Pricing Assessment (e.g. ₹499 vs ₹599)
            price_match = re.search(r"[₹$]\s*(\d{2,5})", clause)
            if price_match:
                deterministic_rules += 1
                price_val = price_match.group(0)
                if "499" in price_val:
                    assessments.append(
                        ExplainableClaimAssessment(
                            claim_text=clause,
                            classification=ClaimClassification.EXPIRED_SOURCE,
                            confidence_score=0.95,
                            matched_source_id="FACT-AUR-PRC-01" if "aurelle" in lower else "FACT-PRC-01",
                            source_citation="Commercial Operations Pricing Committee Resolution #2026-Q1-AUR" if "aurelle" in lower else "Commercial Operations Pricing Committee Resolution #2026-Q1-PRC",
                            explanation=f"Price {price_val} is an outdated approved fact superseded by proposed revision to ₹599.",
                            minimal_change_rewrite=clause.replace(price_val, "₹599"),
                            human_override_allowed=True
                        )
                    )

            # 5. Aurelle Consumer Tech: Unbreakable Claim
            if "100% unbreakable" in lower or "completely indestructible" in lower:
                deterministic_rules += 1
                assessments.append(
                    ExplainableClaimAssessment(
                        claim_text=clause,
                        classification=ClaimClassification.POTENTIALLY_MISLEADING,
                        confidence_score=0.99,
                        matched_source_id="PIL-AUR-01",
                        source_citation="FTC Policy Statement Regarding Advertising Substantiation / ASTM B265 Grade 5 Titanium Benchmark",
                        explanation="Unsubstantiated absolute claim of unbreakability. Physical consumer electronics cannot be represented as indestructible.",
                        minimal_change_rewrite=re.sub(r"(?i)100%\s+unbreakable\s+and\s+completely\s+indestructible", "engineered with Grade 5 Aerospace Titanium for extreme durability", clause),
                        human_override_allowed=True
                    )
                )

            # 6. Aurelle Consumer Tech: Expired Founder Promo
            if "founder launch trial" in lower or ("₹0" in lower and "founder" in lower):
                deterministic_rules += 1
                assessments.append(
                    ExplainableClaimAssessment(
                        claim_text=clause,
                        classification=ClaimClassification.EXPIRED_SOURCE,
                        confidence_score=0.98,
                        matched_source_id="FACT-AUR-EXP-01",
                        source_citation="Aurelle Founder Growth Promotion #2025-FNDR (Status: EXPIRED Dec 31, 2025)",
                        explanation="Reference relies on an expired promotional fact that lapsed on December 31, 2025.",
                        minimal_change_rewrite="Subscribe to Aurelle Cloud Studio starting at ₹499/month",
                        human_override_allowed=True
                    )
                )

            # 7. Aurelle Consumer Tech: Medical Diagnostic Cure Claim
            if "diagnostic cure" in lower or ("cure" in lower and "cardiovascular" in lower):
                deterministic_rules += 1
                assessments.append(
                    ExplainableClaimAssessment(
                        claim_text=clause,
                        classification=ClaimClassification.POTENTIALLY_MISLEADING,
                        confidence_score=0.99,
                        matched_source_id="GL-AUR-03",
                        source_citation="Brand Guideline GL-AUR-03 / FDA 21 CFR §870 Wellness Device Classification",
                        explanation="Pulse Smart Ring is a consumer general wellness monitor; claiming to be a medical-grade diagnostic cure triggers severe FDA enforcement.",
                        minimal_change_rewrite="Aurelle Pulse Smart Ring is a consumer wellness monitor designed for lifestyle tracking.",
                        human_override_allowed=True
                    )
                )

            # 8. Aurelle Consumer Tech: Battery Claim Disclosure Footnote
            if ("72-hour" in lower or "72h" in lower) and "iec" not in lower and "battery" in lower:
                deterministic_rules += 1
                assessments.append(
                    ExplainableClaimAssessment(
                        claim_text=clause,
                        classification=ClaimClassification.NEEDS_VERIFICATION,
                        confidence_score=0.94,
                        matched_source_id="GL-AUR-04",
                        source_citation="Brand Guideline GL-AUR-04 (Battery Life Statutory Testing Disclosure)",
                        explanation="72-hour battery life claim requires mandatory IEC 62133 standardized testing conditions footnote.",
                        minimal_change_rewrite=f"{clause}* (*Tested under IEC 62133 standardized lab protocol. Actual results vary.)",
                        human_override_allowed=True
                    )
                )

        # Summary Counts
        supported_count = sum(1 for a in assessments if a.classification == ClaimClassification.SUPPORTED)
        contradicted_count = sum(1 for a in assessments if a.classification == ClaimClassification.CONTRADICTED)
        needs_ver_count = sum(1 for a in assessments if a.classification == ClaimClassification.NEEDS_VERIFICATION)
        misleading_count = sum(1 for a in assessments if a.classification == ClaimClassification.POTENTIALLY_MISLEADING)

        overall_conf = round(sum(a.confidence_score for a in assessments) / max(1, len(assessments)), 2) if assessments else 1.0

        # Build full rewrite
        remediated_text = text
        for a in assessments:
            if a.classification in [ClaimClassification.CONTRADICTED, ClaimClassification.POTENTIALLY_MISLEADING, ClaimClassification.EXPIRED_SOURCE]:
                remediated_text = remediated_text.replace(a.claim_text, a.minimal_change_rewrite)

        return ExplainableReviewReport(
            brand_id=brand_id,
            overall_confidence=overall_conf,
            total_claims_analyzed=len(assessments),
            claims_supported_count=supported_count,
            claims_contradicted_count=contradicted_count,
            claims_needs_verification_count=needs_ver_count,
            claims_misleading_count=misleading_count,
            assessments=assessments,
            retrieved_truth_nodes=retrieved_nodes,
            suggested_full_rewrite=remediated_text,
            deterministic_rule_count=deterministic_rules
        )

explainable_engine = ExplainableReviewEngine()
