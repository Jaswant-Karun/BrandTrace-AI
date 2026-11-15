import re
import time
import uuid
from typing import Dict, List, Tuple, Optional, Any
from brandtrace.graph.engine import BrandKnowledgeGraph
from brandtrace.graph.schema import SeverityLevel, NodeType
from brandtrace.core.security import generate_release_proof
from brandtrace.agents.schema import (
    RiskSpan, AgentFinding, VerificationRequest, VerificationResult
)
from brandtrace.engine.content_intelligence import content_intelligence_engine

class VoicePersonaAgent:
    def analyze(self, text: str, bkg: BrandKnowledgeGraph) -> AgentFinding:
        risk_spans: List[RiskSpan] = []
        banned_hype_words = ["insane", "unbeatable", "miracle", "cheap", "crush the competition", "game-changer"]
        
        lower_text = text.lower()
        for word in banned_hype_words:
            pattern = re.compile(rf"\b{re.escape(word)}\b", re.IGNORECASE)
            for m in pattern.finditer(text):
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(),
                        category="VOICE",
                        severity=SeverityLevel.MODERATE,
                        explanation=f"Informal/sensationalist vocabulary '{m.group()}' violates brand tone guidelines of disciplined precision.",
                        rule_citation="Brand Tone Directive: TONE-01 Precision Engineering & TONE-02 Visionary Sophistication",
                        suggested_fix="Use measured, empirical descriptors."
                    )
                )

        # Check sentence capitalization and exclamation mark overuse
        exclamation_matches = [m.start() for m in re.finditer(r"!{2,}", text)]
        for pos in exclamation_matches:
            risk_spans.append(
                RiskSpan(
                    start_char=pos,
                    end_char=pos + 2,
                    matched_text=text[pos:pos+2],
                    category="VOICE",
                    severity=SeverityLevel.LOW,
                    explanation="Multiple exclamation marks violate enterprise executive tone guidelines.",
                    rule_citation="Brand Tone Directive: TONE-02 Restrained Authority",
                    suggested_fix="Use single period."
                )
            )

        # Dynamic Brand Voice Document Grounding (Phase 2)
        try:
            from brandtrace.database.mongo import mongo_manager
            indexed_voice_docs = [
                d for d in mongo_manager._memory_documents.values()
                if (d.get("workspace_id") == getattr(bkg, "brand_id", "") or 
                    d.get("organisation_id") == getattr(bkg, "org_id", ""))
                and d.get("processing_status") == "INDEXED"
                and d.get("category") == "BRAND_VOICE"
                and not d.get("is_demo", False)
            ]
            for doc in indexed_voice_docs:
                doc_id = doc.get("doc_id", "DOC-VOICE")
                ver = doc.get("version_number", "1.0")
                title = doc.get("title", "Brand Voice Mandate")
                content = doc.get("raw_content", "")
                for line in content.split("\n"):
                    if "prohibited" in line.lower() or "banned" in line.lower() or "disallowed" in line.lower():
                        terms = re.findall(r"['\"]([^'\"]+)['\"]", line)
                        for term in terms:
                            pat = re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
                            for m in pat.finditer(text):
                                risk_spans.append(
                                    RiskSpan(
                                        start_char=m.start(),
                                        end_char=m.end(),
                                        matched_text=m.group(),
                                        category="VOICE",
                                        severity=SeverityLevel.MODERATE,
                                        explanation=f"Vocabulary '{m.group()}' violates brand voice mandate in {doc_id} (v{ver}).",
                                        rule_citation=f"Document {doc_id} (v{ver}): {title}",
                                        suggested_fix="Use approved brand vocabulary."
                                    )
                                )
        except Exception:
            pass

        score = max(0.0, 100.0 - (len(risk_spans) * 18.0))
        status = "PASSED" if score >= 80 else ("WARNING" if score >= 50 else "FAILED")
        
        return AgentFinding(
            agent_name="Brand Voice & Persona Agent",
            score=round(score, 1),
            status=status,
            confidence=0.94,
            summary=f"Voice fidelity scored at {score}/100. Detected {len(risk_spans)} stylistic deviation(s).",
            risk_spans=risk_spans,
            citations=["TONE-01: Precision Engineering", "TONE-02: Visionary Sophistication"]
        )

class ClaimSubstantiationAgent:
    def analyze(self, text: str, bkg: BrandKnowledgeGraph) -> AgentFinding:
        risk_spans: List[RiskSpan] = []
        citations: List[str] = []

        # 1. Range Claim Check (e.g. 520 miles vs exaggerated range)
        range_matches = list(re.finditer(r"(\b\d{2,4}\b)\s*miles?", text, re.IGNORECASE))
        for m in range_matches:
            claimed_val = int(m.group(1))
            full_match = m.group(0)
            
            # Check if this matches approved claim AC-01 (520 miles)
            if claimed_val == 520:
                # Check for qualifier "EPA-estimated"
                context = text[max(0, m.start() - 30):min(len(text), m.end() + 30)].lower()
                if "epa" not in context and "estimated" not in context and "wltp" not in context:
                    risk_spans.append(
                        RiskSpan(
                            start_char=m.start(),
                            end_char=m.end(),
                            matched_text=full_match,
                            category="CLAIM",
                            severity=SeverityLevel.HIGH,
                            explanation="520-mile range claim requires mandatory 'EPA-estimated' qualifier to avoid regulatory action.",
                            rule_citation="Approved Claim AC-01 (Citation: EPA Test Cycle J1634_202409, Certificate #EV-APX-982)",
                            suggested_fix=f"{full_match} (EPA-estimated)"
                        )
                    )
                else:
                    citations.append("AC-01: 520 miles EPA-estimated (Certificate #EV-APX-982)")
            elif claimed_val > 520:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=full_match,
                        category="CLAIM",
                        severity=SeverityLevel.CRITICAL,
                        explanation=f"Claimed range of {claimed_val} miles exceeds maximum empirically certified threshold of 520 miles.",
                        rule_citation="Approved Claim AC-01 / FTC Claim Substantiation Doctrine",
                        suggested_fix="Up to 520 miles (EPA-estimated)"
                    )
                )

        # 2. Charging Claim Check (e.g. 14 minutes)
        charge_matches = list(re.finditer(r"(\b\d{1,3}\b)\s*min(?:utes?)?", text, re.IGNORECASE))
        for m in charge_matches:
            val = int(m.group(1))
            if val < 14 and "charge" in text.lower():
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.CRITICAL,
                        explanation=f"Claim of {val} minutes fast charging is unverified. Certified lab protocol confirms 10-80% in 14 minutes at 350kW DC.",
                        rule_citation="Approved Claim AC-02 (Apex Lab Protocol AP-LAB-884-C)",
                        suggested_fix="10% to 80% in 14 minutes via 350kW DC charger"
                    )
                )
            elif val == 14 and "charge" in text.lower():
                citations.append("AC-02: 10% to 80% in 14 min (Protocol AP-LAB-884-C)")

        # 3. Clinical / Health Claims (for biopharma brand & wellness devices)
        if "apob" in text.lower() or "cholesterol" in text.lower():
            if "cure" in text.lower() or "eliminates" in text.lower():
                m = re.search(r"\b(cure|eliminates|100% cure)\b", text, re.IGNORECASE)
                if m:
                    risk_spans.append(
                        RiskSpan(
                            start_char=m.start(),
                            end_char=m.end(),
                            matched_text=m.group(0),
                            category="CLAIM",
                            severity=SeverityLevel.CRITICAL,
                            explanation="Therapeutic efficacy claim cannot state 'cure' for chronic vascular conditions under FDA Fair Balance rules.",
                            rule_citation="FDA 21 CFR §202.1 / Prohibited Claim PC-NH-01",
                            suggested_fix="clinically demonstrated to reduce ApoB by up to 38%"
                        )
                    )

        # 4. Aurelle Consumer Tech: Unbreakable Claim
        if "100% unbreakable" in text.lower() or "completely indestructible" in text.lower():
            m = re.search(r"\b(100%\s+unbreakable|completely\s+indestructible)\b", text, re.IGNORECASE)
            if m:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.CRITICAL,
                        explanation="Unsubstantiated absolute durability claim violates FTC Claim Substantiation Doctrine. Physical materials cannot be represented as indestructible.",
                        rule_citation="FTC Policy Statement Regarding Advertising Substantiation / ASTM B265 Grade 5 Titanium Benchmark",
                        suggested_fix="engineered with Grade 5 Aerospace Titanium for extreme durability"
                    )
                )

        # 5. Aurelle Consumer Tech: Expired Founder Trial Fact
        if "founder launch trial" in text.lower() or ("₹0" in text and "founder" in text.lower()):
            m = re.search(r"\b(₹0\s+free\s+for\s+6\s+months|founder\s+launch\s+trial)\b", text, re.IGNORECASE)
            if m:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.HIGH,
                        explanation="Reference to ₹0 Founder Promotion relies on an expired approved fact that lapsed on Dec 31, 2025.",
                        rule_citation="Approved Fact FACT-AUR-EXP-01 (Status: EXPIRED Dec 31, 2025)",
                        suggested_fix="Aurelle Cloud Studio subscription starting at ₹499/month"
                    )
                )

        # 6. Aurelle Consumer Tech: Battery Claim Disclosure
        if ("72-hour" in text.lower() or "72h" in text.lower()) and "iec" not in text.lower():
            m = re.search(r"\b(72-hour|72h)\s+(?:continuous\s+)?battery\b", text, re.IGNORECASE)
            if m:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.HIGH,
                        explanation="72-hour continuous battery claim requires mandatory IEC 62133 laboratory benchmark disclaimer footnote.",
                        rule_citation="Brand Guideline GL-AUR-04 (Battery Life Statutory Testing Disclosure)",
                        suggested_fix=f"{m.group(0)}* (*Tested under IEC 62133 standardized lab protocol. Actual results vary.)"
                    )
                )

        # Dynamic User-Created Brand Documents Grounding (Phase 2)
        try:
            from brandtrace.database.mongo import mongo_manager
            indexed_docs = [
                d for d in mongo_manager._memory_documents.values()
                if (d.get("workspace_id") == getattr(bkg, "brand_id", "") or 
                    d.get("organisation_id") == getattr(bkg, "org_id", ""))
                and d.get("processing_status") == "INDEXED"
                and not d.get("is_demo", False)
            ]
            for doc in indexed_docs:
                doc_id = doc.get("doc_id", "DOC-USER")
                ver = doc.get("version_number", "1.0")
                title = doc.get("title", "Approved Document")
                content = doc.get("raw_content", "")
                cat = doc.get("category", "")
                
                # Check for pricing policies in user documents
                if cat == "PRICING_POLICIES" or "price" in title.lower():
                    title_keywords = [
                        w.lower() for w in re.findall(r"\b[A-Za-z0-9]+\b", title) 
                        if w.lower() not in ["aurelle", "apex", "pricing", "policies", "policy", "special", "directive", "guidelines", "standards", "q1", "q2", "q3", "q4", "2026", "the", "for", "and", "in"]
                    ]
                    subject_matches = any(kw in text.lower() for kw in title_keywords) if title_keywords else False
                    if subject_matches:
                        price_matches = re.findall(r"([₹\$€]\s*\d+(?:[,\.]\d+)?)", content)
                        if price_matches:
                            approved_price = price_matches[0].replace(" ", "")
                            for pm in re.finditer(r"([₹\$€]\s*\d+(?:[,\.]\d+)?)", text):
                                claimed_price = pm.group(1).replace(" ", "")
                                if claimed_price != approved_price and any(k in text.lower() for k in ["month", "price", "subscription", "cost", "fee"]):
                                    risk_spans.append(
                                        RiskSpan(
                                            start_char=pm.start(),
                                            end_char=pm.end(),
                                            matched_text=pm.group(0),
                                            category="CLAIM",
                                            severity=SeverityLevel.CRITICAL,
                                            explanation=f"Pricing claim '{claimed_price}' contradicts certified price '{approved_price}' mandated in {title}.",
                                            rule_citation=f"Certified Policy {doc_id} (v{ver}): {title}",
                                            suggested_fix=approved_price
                                        )
                                    )
                                elif claimed_price == approved_price:
                                    citation_str = f"{doc_id} (v{ver}): {title} (Approved Price: {approved_price})"
                                    if citation_str not in citations:
                                        citations.append(citation_str)
                                    
                # Check for document title / explicit fact references
                if title.lower() in text.lower() or doc_id.lower() in text.lower():
                    citation_entry = f"{doc_id} (v{ver}): {title}"
                    if citation_entry not in citations:
                        citations.append(citation_entry)
        except Exception:
            pass

        score = max(0.0, 100.0 - (len(risk_spans) * 35.0))
        status = "PASSED" if score >= 80 else ("WARNING" if score >= 50 else "FAILED")

        return AgentFinding(
            agent_name="Claim & Fact Substantiation Agent",
            score=round(score, 1),
            status=status,
            confidence=0.96,
            summary=f"Claim substantiation scored at {score}/100. Verified against {len(citations)} approved truth nodes.",
            risk_spans=risk_spans,
            citations=citations
        )

class RegulatoryComplianceAgent:
    def analyze(self, text: str, bkg: BrandKnowledgeGraph) -> AgentFinding:
        risk_spans: List[RiskSpan] = []
        citations: List[str] = []

        # 1. Greenwashing & Environmental Claims (FTC Green Guides §260 / EU Directive)
        greenwashing_patterns = [
            (r"\b100%\s+eco-?friendly\b", "Blanket '100% eco-friendly' claim prohibited without cradle-to-grave lifecycle disclosure.", "REG-01 / FTC Green Guides 16 CFR §260.4"),
            (r"\bzero-?carbon\s+footprint\b", "Absolute zero carbon claim triggers EU Green Claims Directive audit sanctions without certified offset documentation.", "REG-02 / EU Green Claims Directive COM/2023/166"),
            (r"\bcompletely\s+green\b", "General environmental benefit claim violates FTC Deception Policy Statement.", "REG-01 / FTC Green Guides §260.4"),
        ]

        for pat, expl, cite in greenwashing_patterns:
            for m in re.finditer(pat, text, re.IGNORECASE):
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="REGULATORY",
                        severity=SeverityLevel.CRITICAL,
                        explanation=expl,
                        rule_citation=cite,
                        suggested_fix="engineered with 85% recycled aluminum and zero direct tailpipe emissions"
                    )
                )
                citations.append(cite)

        # 2. Autonomous Vehicle Safety Marketing (NHTSA Level 2 Directive)
        autonomous_patterns = [
            (r"\bfully\s+autonomous\b", "Claiming 'fully autonomous' on SAE Level 2 driver assistance system triggers immediate federal investigation.", "REG-03 / NHTSA SGO 2021-01"),
            (r"\bhands-?free\s+without\s+looking\b", "Misleading safety assertion encouraging driver distraction.", "REG-03 / NHTSA Safety Mandate"),
            (r"\bself-?driving\s+without\s+supervision\b", "Severe consumer deception risk regarding automated driving capabilities.", "REG-03 / California DMV Reg §227.38"),
        ]

        for pat, expl, cite in autonomous_patterns:
            for m in re.finditer(pat, text, re.IGNORECASE):
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="REGULATORY",
                        severity=SeverityLevel.CRITICAL,
                        explanation=expl,
                        rule_citation=cite,
                        suggested_fix="advanced driver-assistance system (requires attentive driver supervision at all times)"
                    )
                )
                citations.append(cite)

        # 3. Trademark Compliance (Check proper symbols & casing)
        trademark_checks = [
            ("quantumcell", "QuantumCell™", "TM-01"),
            ("hyperdrive os", "HyperDrive OS®", "TM-02"),
            ("aeroglide", "AeroGlide™", "TM-03"),
            ("cardioshield", "CardioShield™", "TM-NH-01"),
            ("quantumacoustics", "QuantumAcoustics™", "TM-AUR-01"),
            ("quantumpower", "QuantumPower™", "TM-AUR-03"),
            ("aurelle horizun", "Aurelle Horizon™", "TM-AUR-02"),
        ]

        for raw_mark, proper_mark, tm_id in trademark_checks:
            # Look for occurrences that lack the symbol or proper capitalization
            pattern = re.compile(rf"\b{re.escape(raw_mark)}\b", re.IGNORECASE)
            for m in pattern.finditer(text):
                actual_found = m.group(0)
                # Check if it has the symbol immediately after
                after_text = text[m.end():m.end() + 2]
                if "horizun" in actual_found.lower() or ("™" not in after_text and "®" not in after_text):
                    risk_spans.append(
                        RiskSpan(
                            start_char=m.start(),
                            end_char=m.end(),
                            matched_text=actual_found,
                            category="TRADEMARK",
                            severity=SeverityLevel.HIGH if "horizun" in actual_found.lower() else SeverityLevel.MODERATE,
                            explanation=f"Product name / trademark '{actual_found}' violates official mark governance '{proper_mark}'.",
                            rule_citation=f"Trademark Governance {tm_id} (Lanham Act §29)",
                            suggested_fix=proper_mark
                        )
                    )
                    citations.append(f"{tm_id}: {proper_mark}")

        # 4. Aurelle Consumer Tech: FDA §870 Wellness vs Diagnostic Medical Claim
        if "medical-grade diagnostic cure" in text.lower() or ("diagnostic cure" in text.lower() and "disease" in text.lower()):
            m = re.search(r"\b(medical-grade\s+diagnostic\s+cure|diagnostic\s+cure)\b", text, re.IGNORECASE)
            if m:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="REGULATORY",
                        severity=SeverityLevel.CRITICAL,
                        explanation="Aurelle Pulse Smart Ring is a consumer general wellness monitor. Stating it is a 'medical-grade diagnostic cure' triggers severe FDA Class II/III statutory penalties under 21 CFR §870.",
                        rule_citation="Brand Guideline GL-AUR-03 / FDA 21 CFR §870 Wellness Device Classification",
                        suggested_fix="consumer biometric wellness monitor designed for lifestyle tracking"
                    )
                )
                citations.append("GL-AUR-03: FDA 21 CFR §870 Non-Diagnostic Wellness Rule")

        # 5. Aurelle Consumer Tech: Logo Clearance & Visual Rules
        if "12px" in text.lower() and ("clearance" in text.lower() or "padding" in text.lower() or "margin" in text.lower()):
            m = re.search(r"\b12px(?:\s+padding)?\s+clearance\b", text, re.IGNORECASE)
            if m:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="VISUAL_IDENTITY",
                        severity=SeverityLevel.HIGH,
                        explanation="Logo margin clearance of 12px violates the mandatory minimum safe-zone threshold of 20px around the Aurelle wordmark.",
                        rule_citation="Brand Guideline GL-AUR-01 (Logo Safe Zone Clearance Mandate)",
                        suggested_fix="20px margin clearance around Aurelle wordmark"
                    )
                )
                citations.append("GL-AUR-01: Logo Safe Zone Clearance Mandate (>= 20px)")

        # 6. Aurelle Consumer Tech: Color Palette Rule (Banned Neon Orange #FF5500)
        if "#ff5500" in text.lower() or "neon orange" in text.lower():
            m = re.search(r"\b(?:Neon\s+Orange\s+)?#FF5500\b", text, re.IGNORECASE)
            if m:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="VISUAL_IDENTITY",
                        severity=SeverityLevel.HIGH,
                        explanation="Detected unauthorized off-palette hue '#FF5500' (Neon Orange). Deviates from authorized palette: Obsidian Black (#0A0E1A) and Champagne Gold (#D4AF37).",
                        rule_citation="Brand Guideline GL-AUR-02 (Approved Master Color Palette)",
                        suggested_fix="Champagne Gold (#D4AF37)"
                    )
                )
                citations.append("GL-AUR-02: Approved Master Color Palette")

        # 7. Aurelle Consumer Tech: Accessibility (WCAG 2.1 AA Contrast & Alt-Text)
        if "2.3:1" in text.lower() or ("low-contrast" in text.lower() and "alt-text" in text.lower()):
            m = re.search(r"\b(?:low-contrast\s+)?#777777\s+body\s+text\s+on\s+#333333\b", text, re.IGNORECASE)
            match_str = m.group(0) if m else "low-contrast #777777 on #333333"
            start_idx = m.start() if m else text.lower().find("low-contrast")
            risk_spans.append(
                RiskSpan(
                    start_char=max(0, start_idx),
                    end_char=max(0, start_idx) + len(match_str),
                    matched_text=match_str,
                    category="ACCESSIBILITY",
                    severity=SeverityLevel.HIGH,
                    explanation="Contrast ratio of 2.3:1 fails WCAG 2.1 Level AA minimum threshold of 4.5:1. Asset also lacks mandatory descriptive alt-text.",
                    rule_citation="Brand Guideline GL-AUR-07 / WCAG 2.1 Success Criterion 1.4.3 (Contrast Minimum)",
                    suggested_fix="#F8FAFC high-contrast text on #0A0E1A background with descriptive alt-text"
                )
            )
            citations.append("GL-AUR-07: WCAG 2.1 AA Accessibility Mandate")

        # 8. Aurelle Consumer Tech: Conflicting Brand Guidelines (Helvetica vs Editorial Serif)
        if "helvetica" in text.lower() and ("regional" in text.lower() or "master" in text.lower() or "conflict" in text.lower()):
            m = re.search(r"\bHelvetica(?:\s+Neue)?\b", text, re.IGNORECASE)
            if m:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="TYPOGRAPHY",
                        severity=SeverityLevel.MODERATE,
                        explanation="Regional guideline mandating Helvetica Neue directly conflicts with Global Master Rule GL-AUR-06 (Editorial Serif headlines, Inter UI). Master rule takes precedence.",
                        rule_citation="Brand Guideline GL-AUR-06 (Global Master Typography Directive)",
                        suggested_fix="Editorial Serif headlines with Inter Enterprise body copy"
                    )
                )
                citations.append("GL-AUR-06: Global Master Typography Directive")

        # 9. Novus Life Sciences: Unapproved Prescription Cure Claim
        if "completely cures" in text.lower() or ("cures" in text.lower() and "hypertension" in text.lower()):
            m = re.search(r"\b(?:completely\s+cures\s+hypertension|completely\s+cures)\b", text, re.IGNORECASE)
            if m:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="REGULATORY",
                        severity=SeverityLevel.CRITICAL,
                        explanation="Unsubstantiated cure claim. Prescription cardiovascular therapeutics cannot claim to cure disease under FDA 21 CFR §201.57 & §202.1.",
                        rule_citation="FDA 21 CFR §201.57 / §202.1 (Non-Cure Prescription Efficacy Standard)",
                        suggested_fix="clinically demonstrated to lower LDL-C and reduce cardiovascular event risk"
                    )
                )
                citations.append("FDA 21 CFR §201.57: Non-Cure Prescription Efficacy Standard")

        # 10. Novus Life Sciences: Omission of Risk Disclosures / Zero Side Effects
        if "zero side effects" in text.lower() or "no side effects" in text.lower():
            m = re.search(r"\b(?:zero|no)\s+side\s+effects\b", text, re.IGNORECASE)
            if m:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="REGULATORY",
                        severity=SeverityLevel.CRITICAL,
                        explanation="Claiming 'zero side effects' on a prescription small molecule violates FDA Fair Balance mandate and triggers mandatory warning letters.",
                        rule_citation="FDA 21 CFR §202.1 (Prescription Drug Fair Balance & Risk Disclosure)",
                        suggested_fix="Consult physician regarding potential contraindications and adverse reactions"
                    )
                )
                citations.append("FDA 21 CFR §202.1: Fair Balance Mandate")

        # 11. Novus Life Sciences: Expired Patient Assistance Program Tier
        if "2024 zero-copay" in text.lower() or "novus care 2024" in text.lower():
            m = re.search(r"\b(?:Novus\s+Care\s+2024\s+zero-copay(?:\s+program)?|2024\s+zero-copay)\b", text, re.IGNORECASE)
            if m:
                risk_spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.HIGH,
                        explanation="Content references expired 2024 patient assistance tier that lapsed on December 31, 2024.",
                        rule_citation="Novus Market Access Directive 2024-EXP (Expired Patient Co-Pay Tier)",
                        suggested_fix="NovusCare 2026 Patient Co-Pay Assistance Program"
                    )
                )
                citations.append("Novus Market Access Directive 2024-EXP")

        score = max(0.0, 100.0 - (len(risk_spans) * 30.0))
        status = "PASSED" if score >= 80 else ("WARNING" if score >= 50 else "FAILED")

        return AgentFinding(
            agent_name="Regulatory & Legal Compliance Agent",
            score=round(score, 1),
            status=status,
            confidence=0.98,
            summary=f"Regulatory compliance scored at {score}/100 with {len(risk_spans)} legal/trademark defect(s).",
            risk_spans=risk_spans,
            citations=list(set(citations))
        )

class AutonomousGovernancePipeline:
    def __init__(self):
        self.voice_agent = VoicePersonaAgent()
        self.claim_agent = ClaimSubstantiationAgent()
        self.legal_agent = RegulatoryComplianceAgent()

    def generate_remediation(self, text: str, risk_spans: List[RiskSpan]) -> Tuple[str, str]:
        """
        Synthesizes a graph-preserving remediation rewrite that fixes all defects while preserving brand voice.
        """
        if not risk_spans:
            return text, "No policy defects detected. Original content meets all governance thresholds."

        # Sort spans in reverse order so replacements don't disrupt character offsets
        sorted_spans = sorted(risk_spans, key=lambda s: s.start_char, reverse=True)
        remediated = text
        changes_applied = []

        for span in sorted_spans:
            if span.suggested_fix:
                orig = remediated[span.start_char:span.end_char]
                remediated = remediated[:span.start_char] + span.suggested_fix + remediated[span.end_char:]
                changes_applied.append(f"Replaced '{orig}' with '{span.suggested_fix}' ({span.category} compliance)")

        # Ensure mandatory safety disclaimer if automotive L2 context was modified
        if "driver" in remediated.lower() or "pilot" in remediated.lower() or "hyperdrive" in remediated.lower():
            if "supervision" not in remediated.lower() and "driver attention" not in remediated.lower():
                remediated += " (Driver supervision required at all times. Systems do not replace attentive driving.)"
                changes_applied.append("Appended mandatory NHTSA Level 2 driver supervision disclaimer")

        rationale = (
            f"Remediated {len(changes_applied)} governance defect(s) to align with brand truth nodes and statutory regulations: "
            + "; ".join(changes_applied[:3]) + ("..." if len(changes_applied) > 3 else ".")
        )

        return remediated, rationale

    def verify_asset(self, request: VerificationRequest, bkg: BrandKnowledgeGraph) -> VerificationResult:
        """
        Executes complete multi-agent governance pipeline on an asset.
        """
        t_start = time.perf_counter()
        t0 = int(time.time())
        t0_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t0))
        verification_id = f"VRF-{uuid.uuid4().hex[:10].upper()}"

        # 0. Content Intelligence & Semantic Intent Analysis
        ci_report = content_intelligence_engine.analyze(request.content)
        is_casual = ci_report.classification.is_greeting_or_casual or ci_report.classification.is_personal
        is_announcement = ci_report.classification.is_announcement
        is_informational = ci_report.classification.is_informational

        all_spans: List[RiskSpan] = []

        if is_casual:
            # Casual greetings and personal messages: do NOT inject brand rules or campaign requirements
            # Voice, Claim, and Legal reports remain clean
            voice_report = AgentFinding(
                agent_name="Voice & Persona Alignment Agent",
                score=100.0,
                status="PASSED",
                confidence=0.99,
                summary="Casual/personal communication classified. No brand voice conflicts.",
                risk_spans=[],
                citations=[]
            )
            claim_report = AgentFinding(
                agent_name="Claim & Fact Substantiation Agent",
                score=100.0,
                status="PASSED",
                confidence=0.99,
                summary="No factual or commercial claims present in conversational content.",
                risk_spans=[],
                citations=[]
            )
            legal_report = AgentFinding(
                agent_name="Regulatory & Legal Compliance Agent",
                score=100.0,
                status="PASSED",
                confidence=0.99,
                summary="Conversational message meets all statutory criteria.",
                risk_spans=[],
                citations=[]
            )

            # Map grammar findings if any into advisory spans
            for gf in ci_report.grammar_findings:
                all_spans.append(
                    RiskSpan(
                        start_char=gf.start_char,
                        end_char=gf.end_char,
                        matched_text=gf.original_text,
                        category="VOICE",
                        severity=SeverityLevel.LOW,
                        explanation=gf.explanation,
                        rule_citation="Editorial Style & Writing Standard (§Grammar & Capitalization)",
                        suggested_fix=gf.suggested_text
                    )
                )

            remediated_text = ci_report.corrected_content
            remediation_rationale = (
                "No policy defects detected. Original content meets all governance thresholds."
                if not all_spans else
                "Enhanced capitalization and punctuation while preserving friendly conversational tone."
            )
            composite_risk = 0.0 if not all_spans else 4.0
            critical_count = 0
            decision = "APPROVED_FOR_RELEASE"
            verdict_badge = "READY FOR REVIEW"
        else:
            # Standard marketing / product / campaign inspection
            voice_report = self.voice_agent.analyze(request.content, bkg)
            claim_report = self.claim_agent.analyze(request.content, bkg)
            legal_report = self.legal_agent.analyze(request.content, bkg)

            all_spans.extend(voice_report.risk_spans)
            all_spans.extend(claim_report.risk_spans)
            all_spans.extend(legal_report.risk_spans)

            # If announcement or schedule without product mentions, suppress spurious hype checks
            if (is_announcement or is_informational) and not any(w in request.content.lower() for w in ["serum", "cream", "skin", "aurelle", "battery", "price", "trial", "sale", "discount"]):
                all_spans = [s for s in all_spans if s.category != "VOICE" or "insane" in s.matched_text.lower() or "unbeatable" in s.matched_text.lower()]

            # 1b. Brand & Aurelle Rulebook Grounding (Facts & Specific Rules)
            brand_id_lower = (request.brand_id or "").lower()
            if not brand_id_lower or "aurelle" in brand_id_lower:
                aurelle_spans = self._analyze_aurelle_specifics(
                    request.content,
                    key_phrases=getattr(request, "key_phrases", None),
                    cta=getattr(request, "call_to_action", None)
                )
                for aspan in aurelle_spans:
                    if not any(abs(s.start_char - aspan.start_char) < 3 and s.matched_text == aspan.matched_text for s in all_spans):
                        all_spans.append(aspan)

            # 1b-2. Ground detected claims from Content Intelligence
            for dc in ci_report.detected_claims:
                if dc.claim_type == "MEDICAL_CURE":
                    if not any("drug" in s.explanation.lower() or "cure" in s.explanation.lower() or "medical" in s.explanation.lower() for s in all_spans):
                        all_spans.append(
                            RiskSpan(
                                start_char=dc.start_char,
                                end_char=dc.end_char,
                                matched_text=dc.claim_text,
                                category="REGULATORY",
                                severity=SeverityLevel.CRITICAL,
                                explanation=dc.explanation,
                                rule_citation=dc.applicable_standard,
                                suggested_fix="supports general health and wellness (consult healthcare professional)"
                            )
                        )
                elif dc.claim_type == "QUANTITATIVE":
                    if not any(dc.claim_text.lower() in s.matched_text.lower() for s in all_spans):
                        all_spans.append(
                            RiskSpan(
                                start_char=dc.start_char,
                                end_char=dc.end_char,
                                matched_text=dc.claim_text,
                                category="CLAIM",
                                severity=SeverityLevel.HIGH,
                                explanation=dc.explanation,
                                rule_citation=dc.applicable_standard,
                                suggested_fix=f"{dc.claim_text}* (*verified under standardized test protocol)"
                            )
                        )
                elif dc.claim_type == "SUBJECTIVE_PUFFERY":
                    if not any(dc.claim_text.lower() in s.matched_text.lower() for s in all_spans):
                        all_spans.append(
                            RiskSpan(
                                start_char=dc.start_char,
                                end_char=dc.end_char,
                                matched_text=dc.claim_text,
                                category="VOICE",
                                severity=SeverityLevel.LOW,
                                explanation=dc.explanation,
                                rule_citation=dc.applicable_standard,
                                suggested_fix="committed to providing high-quality service"
                            )
                        )

            # 1b-3. Ground grammar findings from Content Intelligence
            for gf in ci_report.grammar_findings:
                if not any(max(s.start_char, gf.start_char) < min(s.end_char, gf.end_char) for s in all_spans):
                    all_spans.append(
                        RiskSpan(
                            start_char=gf.start_char,
                            end_char=gf.end_char,
                            matched_text=gf.original_text,
                            category="VOICE",
                            severity=SeverityLevel.LOW,
                            explanation=gf.explanation,
                            rule_citation="Editorial Style & Writing Standard (§Grammar & Phrasing)",
                            suggested_fix=gf.suggested_text
                        )
                    )

            # 1c. Configured AI Provider Grounding (Gemini / Semantic Intelligence)
            try:
                from brandtrace.engine.ai_provider import ai_provider
                truth_nodes = [{"id": f.id, "label": f.name} for f in getattr(bkg, "approved_facts", {}).values()] if hasattr(bkg, "approved_facts") else []
                ai_findings = ai_provider.generate_grounded_review_sync(request.content, truth_nodes, [])
                for af in ai_findings:
                    if af.exact_text and af.exact_text.lower() in request.content.lower():
                        s_idx = request.content.lower().find(af.exact_text.lower())
                        e_idx = s_idx + len(af.exact_text)
                        if not any(max(s.start_char, s_idx) < min(s.end_char, e_idx) for s in all_spans):
                            sev_map = {
                                "CRITICAL": SeverityLevel.CRITICAL,
                                "BLOCKING": SeverityLevel.CRITICAL,
                                "HIGH": SeverityLevel.HIGH,
                                "MAJOR": SeverityLevel.HIGH,
                                "MODERATE": SeverityLevel.MODERATE,
                                "LOW": SeverityLevel.LOW
                            }
                            all_spans.append(
                                RiskSpan(
                                    start_char=s_idx,
                                    end_char=e_idx,
                                    matched_text=request.content[s_idx:e_idx],
                                    category=af.category,
                                    severity=sev_map.get(af.severity, SeverityLevel.MODERATE),
                                    explanation=af.explanation,
                                    rule_citation=f"{af.citation.rule_or_fact_id} ({af.citation.source_title})",
                                    suggested_fix=af.suggested_correction
                                )
                            )
            except Exception:
                pass

            # 1d. Multimodal & Cross-Modal Image Grounding
            if request.image_analysis and isinstance(request.image_analysis, dict):
                raw_findings = (request.image_analysis.get("findings") or []) + (request.image_analysis.get("cross_modal_findings") or [])
                for imf in raw_findings:
                    if isinstance(imf, dict):
                        loc = imf.get("location", "Visual Asset")
                        expl = imf.get("explanation", "Visual rule finding")
                        cite = imf.get("rule_citation", "Visual Guidelines")
                        fix = imf.get("suggested_fix", "")
                        sev_val = str(imf.get("severity", "MODERATE")).upper()
                        cat = imf.get("category", "VISUAL")
                    else:
                        loc = getattr(imf, "location", "Visual Asset")
                        expl = getattr(imf, "explanation", "Visual rule finding")
                        cite = getattr(imf, "rule_citation", "Visual Guidelines")
                        fix = getattr(imf, "suggested_fix", "")
                        sev_val = str(getattr(imf, "severity", "MODERATE")).upper()
                        cat = getattr(imf, "category", "VISUAL")

                    sev_map = {
                        "CRITICAL": SeverityLevel.CRITICAL,
                        "BLOCKING": SeverityLevel.CRITICAL,
                        "HIGH": SeverityLevel.HIGH,
                        "MAJOR": SeverityLevel.HIGH,
                        "MODERATE": SeverityLevel.MODERATE,
                        "LOW": SeverityLevel.LOW,
                        "INFO": SeverityLevel.LOW,
                    }
                    actual_sev = sev_map.get(sev_val, SeverityLevel.MODERATE)

                    s_idx = 0
                    e_idx = min(len(request.content), 25)
                    matched_str = loc
                    for kw in ["100% natural", "zero toxins", "60%", "2 weeks", "₹499", "completely healed", "cures eczema", "treatment"]:
                        if kw in expl.lower() and kw in request.content.lower():
                            f_idx = request.content.lower().find(kw)
                            s_idx = f_idx
                            e_idx = f_idx + len(kw)
                            matched_str = request.content[s_idx:e_idx]
                            break

                    if not any(s.explanation == expl for s in all_spans):
                        all_spans.append(
                            RiskSpan(
                                start_char=s_idx,
                                end_char=e_idx,
                                matched_text=matched_str,
                                category="CLAIM" if "contradict" in expl.lower() else ("VISUAL" if "color" in expl.lower() or "contrast" in expl.lower() else "REGULATORY"),
                                severity=actual_sev,
                                explanation=expl,
                                rule_citation=cite,
                                suggested_fix=fix
                            )
                        )

            # 2. Risk Scoring & Governance Gate
            risk_points = 0.0
            critical_count = 0
            for span in all_spans:
                if span.severity == SeverityLevel.CRITICAL:
                    risk_points += 35.0
                    critical_count += 1
                elif span.severity == SeverityLevel.HIGH:
                    risk_points += 20.0
                elif span.severity == SeverityLevel.MODERATE:
                    risk_points += 10.0
                elif span.severity == SeverityLevel.LOW:
                    risk_points += 4.0

            composite_risk = min(100.0, round(risk_points, 1))

            if critical_count > 0 or composite_risk >= 50:
                decision = "REJECTED_GATED"
            elif composite_risk >= 20:
                decision = "STAGED_FOR_HUMAN_REVIEW"
            else:
                decision = "APPROVED_FOR_RELEASE"

            # 3. Generate Remediation
            remediated_text, remediation_rationale = self.generate_remediation(request.content, all_spans)
            if remediated_text == request.content and ci_report.corrected_content != request.content:
                remediated_text = ci_report.corrected_content
            remediated_text = re.sub(r"\s+([,\.!?;:])", r"\1", remediated_text)

        # 4. Generate Sentence-Level Findings & Verdict
        sentence_findings = self._build_sentence_findings(request.content, all_spans)
        summary_counts = {
            "blocking": len([f for f in sentence_findings if f["severity"] == "BLOCKING"]),
            "major": len([f for f in sentence_findings if f["severity"] == "MAJOR"]),
            "minor": len([f for f in sentence_findings if f["severity"] == "MINOR"]),
            "needs_human": len([f for f in sentence_findings if f.get("needs_human_review") or f["severity"] == "NEEDS_HUMAN"]),
            "advisory": len([f for f in sentence_findings if f["severity"] == "ADVISORY"])
        }

        if summary_counts["blocking"] > 0:
            verdict_badge = "CORRECTIONS REQUIRED"
        elif summary_counts["needs_human"] > 0 or summary_counts["major"] > 0:
            verdict_badge = "HUMAN REVIEW REQUIRED"
        else:
            verdict_badge = "READY FOR REVIEW"

        # 5. Generate Cryptographic Release Proof
        proof = generate_release_proof(
            asset_id=request.asset_id or verification_id,
            asset_content=request.content,
            brand_id=request.brand_id,
            verification_summary={
                "risk_score": composite_risk,
                "decision": decision,
                "critical_flags": critical_count,
                "spans_count": len(all_spans)
            }
        )

        latency_ms = round((time.perf_counter() - t_start) * 1000, 2)

        return VerificationResult(
            verification_id=verification_id,
            brand_id=request.brand_id,
            asset_id=request.asset_id,
            asset_title=request.asset_title or "Ad-hoc Marketing Asset",
            channel=request.channel,
            raw_content=request.content,
            composite_risk_score=composite_risk,
            governance_decision=decision,
            agent_reports={
                "voice_persona": voice_report,
                "claim_substantiation": claim_report,
                "regulatory_compliance": legal_report
            },
            all_risk_spans=all_spans,
            remediated_content=remediated_text,
            remediation_rationale=remediation_rationale,
            release_proof=proof,
            latency_ms=latency_ms,
            agents_count=3,
            timestamp=t0,
            timestamp_iso=t0_iso,
            sentence_findings=sentence_findings,
            summary_counts=summary_counts,
            verdict_badge=verdict_badge,
            image_analysis=request.image_analysis,
            content_type=ci_report.classification.content_type,
            intent=ci_report.classification.intent,
            summary=ci_report.classification.summary,
            original_content=ci_report.original_content,
            corrected_content=ci_report.corrected_content,
            grammar_findings=[f.model_dump() for f in ci_report.grammar_findings],
            claim_findings=[c.model_dump() for c in ci_report.detected_claims],
            policy_findings=[f for f in sentence_findings if f.get("category") in ["POLICY", "VOICE", "BRAND"] or f.get("severity") in ["BLOCKING", "CRITICAL"]],
            regulatory_findings=[f for f in sentence_findings if f.get("category") in ["REGULATORY", "STATUTORY"]],
            brand_findings=[f for f in sentence_findings if "FACT" in f.get("rule_citation", "") or "Brand" in f.get("rule_citation", "")],
            suggestions=[{"original": f.original_text, "suggested": f.suggested_text, "explanation": f.explanation} for f in ci_report.grammar_findings],
            overall_status=ci_report.overall_status,
            analysis_status="SUCCESS",
            limitations=ci_report.limitations or []
        )

    def _analyze_aurelle_specifics(self, text: str, key_phrases: Optional[str] = None, cta: Optional[str] = None) -> List[RiskSpan]:
        spans: List[RiskSpan] = []
        lower_text = text.lower()
        has_cosmetic_context = any(w in lower_text for w in [
            "skin", "spots", "barrier", "serum", "vitamin c", "aurelle", "cream",
            "lotion", "dermatol", "cosmetic", "glow", "blemish", "face", "complexion"
        ])

        # 1. FACT-014: Dark spots study benchmark & timeline exaggeration (Cosmetics context only)
        if has_cosmetic_context:
            dark_spots_pattern = re.compile(r"\b(?:fade\s+dark\s+spots\s+)?(?:by\s+)?60%(?:\s+in\s+just\s+2\s+weeks|\s+in\s+2\s+weeks)?\b", re.IGNORECASE)
            for m in dark_spots_pattern.finditer(text):
                spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.CRITICAL,
                        explanation="Clinical evidence confirms 32% reduction in 8 weeks under protocol AUR-LAB-014, not 60% in 2 weeks.",
                        rule_citation="FACT-014 (Clinical Hydration & Barrier Benchmark)",
                        suggested_fix="fade dark spots by 32% in 8 weeks (FACT-014)"
                    )
                )

            # 1b. FACT-014: Concentration percentage check against approved formula (15% Ethyl Ascorbic Acid)
            vit_c_pattern = re.compile(r"\b([2-9]\d|\d{3})%\s*(?:vitamin\s+c|ethyl\s+ascorbic)\b", re.IGNORECASE)
            for m in vit_c_pattern.finditer(text):
                spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.CRITICAL,
                        explanation=f"Claimed concentration '{m.group(0)}' contradicts approved formulation of 15% Ethyl Ascorbic Acid (FACT-014).",
                        rule_citation="FACT-014 (Clinical Formulation & Barrier Benchmark)",
                        suggested_fix="15% Vitamin C"
                    )
                )

            # 2. Healed skin barrier / cure claim
            barrier_pattern = re.compile(r"\b(?:my\s+)?skin\s+barrier\s+is\s+completely\s+healed\b", re.IGNORECASE)
            for m in barrier_pattern.finditer(text):
                spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.HIGH,
                        explanation="Cosmetics cannot claim permanent physiological healing of dermal barriers under CDSCO & FDA guidelines.",
                        rule_citation="Approved Claim AC-AUR-03 / CDSCO Drugs & Cosmetics Act",
                        suggested_fix="skin barrier function is visibly supported"
                    )
                )

        # 3. Medical / Disease Treatment (e.g. Eczema, Dermatitis, Acne Cures)
        cure_pattern = re.compile(r"\b(?:cures?\s+(?:dermatitis|acne|eczema|psoriasis)|treats?\s+(?:cystic\s+acne|dermatitis)|treatment\s+for\s+(?:eczema|acne|dermatitis)(?:(?:\s+and\s+dry)?,\s+itchy\s+skin)?)\b", re.IGNORECASE)
        for m in cure_pattern.finditer(text):
            spans.append(
                RiskSpan(
                    start_char=m.start(),
                    end_char=m.end(),
                    matched_text=m.group(0),
                    category="REGULATORY",
                    severity=SeverityLevel.CRITICAL,
                    explanation=f"Claiming a cosmetic product '{m.group(0)}' classifies the product as an unapproved drug under FDA 21 CFR §201/§202 and CDSCO rules.",
                    rule_citation="REG-FDA-201 / FDA 21 CFR §201 Cosmetic Non-Cure Mandate",
                    suggested_fix="supports healthy-looking, clear skin"
                )
            )

        # 3b. Unverified clinical or performance efficacy claims (Unsupported Claims)
        unverified_pattern = re.compile(
            r"\b(?:proven|clinically\s+proven|guaranteed)\s+to\s+(?:boost|reduce|increase|erase|eliminate)[^\.\n,!]*\b(\d{1,3}%|\d+\s*minutes?|\d+\s*hours?)\b",
            re.IGNORECASE
        )
        for m in unverified_pattern.finditer(text):
            if "FACT-014" not in text and "AUR-LAB-014" not in text:
                spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.HIGH,
                        explanation=f"Performance claim '{m.group(0)}' lacks substantiated clinical trial evidence in the Brand Knowledge Graph ledger. Unverified efficacy claim requires human review.",
                        rule_citation="FTC Policy Statement Regarding Advertising Substantiation / Unverified Claim",
                        suggested_fix="clinically tested formulation (substantiation required)"
                    )
                )

        # 4. Greenwashing: "100% natural, zero toxins" or "completely eco-friendly"
        green_pattern = re.compile(r"\b(?:100%\s+natural(?:,\s+completely\s+eco-friendly)?|100%\s+natural,\s+zero\s+toxins|zero\s+toxins)\b", re.IGNORECASE)
        for m in green_pattern.finditer(text):
            spans.append(
                RiskSpan(
                    start_char=m.start(),
                    end_char=m.end(),
                    matched_text=m.group(0),
                    category="REGULATORY",
                    severity=SeverityLevel.CRITICAL,
                    explanation="Absolute unquantified '100% natural' and 'zero toxins' claims are prohibited without lifecycle analysis documentation.",
                    rule_citation="REG-01 / FTC Green Guides 16 CFR §260.4 & ASCI Guidelines",
                    suggested_fix="formulated with 94% naturally derived ingredients"
                )
            )

        # 5. Doctor approved / Guaranteed glass skin
        guarantee_pattern = re.compile(r"\b(?:guaranteed\s+glass\s+skin\s+in\s+7\s+days|doctor\s+approved\s+and\s+guaranteed\s+results)\b", re.IGNORECASE)
        for m in guarantee_pattern.finditer(text):
            spans.append(
                RiskSpan(
                    start_char=m.start(),
                    end_char=m.end(),
                    matched_text=m.group(0),
                    category="VOICE",
                    severity=SeverityLevel.HIGH,
                    explanation="Absolute guarantee of cosmetic efficacy is deceptive and violates ASCI Chapter 1 truthfulness mandates.",
                    rule_citation="Brand Guideline GL-AUR-03 (Prohibited Absolute Guarantees)",
                    suggested_fix="dermatologist tested for radiant-looking skin"
                )
            )

        # 6. Pricing fact check: ₹499 vs ₹899 (Serum) or ₹499 vs ₹599 (Spatial Computing)
        if "serum" in lower_text or "vitamin c" in lower_text or "brightening" in lower_text or "skincare" in lower_text:
            price_pattern = re.compile(r"(?:₹|rs\.?\s*)499\b", re.IGNORECASE)
            for m in price_pattern.finditer(text):
                spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.CRITICAL,
                        explanation="Authorized retail price for Aurelle Vitamin C Brightening Serum is ₹899 for 30 ml (FACT-006).",
                        rule_citation="Approved Fact FACT-006 (Aurelle Skin Pricing Master Schedule)",
                        suggested_fix="₹899"
                    )
                )
        elif "spatial computing" in lower_text:
            price_pattern = re.compile(r"(?:₹|rs\.?\s*)499\b", re.IGNORECASE)
            for m in price_pattern.finditer(text):
                spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=m.group(0),
                        category="CLAIM",
                        severity=SeverityLevel.HIGH,
                        explanation="References superseded subscription price of ₹499 instead of current approved price ₹599 (FACT-AUR-PRC-01).",
                        rule_citation="Approved Fact FACT-AUR-PRC-01 (Aurelle Cloud Studio Subscription Price)",
                        suggested_fix="₹599"
                    )
                )

        # 7. DL-01: Discounts & Offers need "T&Cs apply"
        if "t&c" not in lower_text and "terms apply" not in lower_text:
            m_sale = re.search(r"\bsale\b", text, re.IGNORECASE)
            if m_sale:
                spans.append(
                    RiskSpan(
                        start_char=m_sale.start(),
                        end_char=m_sale.end(),
                        matched_text=m_sale.group(0),
                        category="REGULATORY",
                        severity=SeverityLevel.CRITICAL,
                        explanation="Promotions must say \"T&Cs apply\" and link to the terms.",
                        rule_citation="Brand Rule DL-01 (Aurelle Brand Book v1.3 §7.3 Promotions)",
                        suggested_fix=f"{m_sale.group(0)} (T&Cs apply)"
                    )
                )

            m_offer = re.search(r"\b(?:\d+%\s+off[^\.\n,!]*|discount[^\.\n,!]*|50%\s+off|buy\s+one\s+get\s+one(?:\s+50%\s+off)?)\b", text, re.IGNORECASE)
            if m_offer:
                spans.append(
                    RiskSpan(
                        start_char=m_offer.start(),
                        end_char=m_offer.end(),
                        matched_text=m_offer.group(0).strip(),
                        category="PROMOTION",
                        severity=SeverityLevel.CRITICAL,
                        explanation="Promotions must say \"T&Cs apply\" and link to the terms.",
                        rule_citation="Brand Rule DL-01 (Aurelle Brand Book v1.3 §7.3 Promotions)",
                        suggested_fix=f"{m_offer.group(0).strip()} (T&Cs apply)"
                    )
                )

        # 8. CIA-02: Calls to action name product, not "link in bio" or "click here"
        cta_bad_pattern = re.compile(r"\b(?:check\s+link\s+in\s+bio(?:\s+to\s+shop)?|link\s+in\s+bio|click\s+here)\b", re.IGNORECASE)
        for m in cta_bad_pattern.finditer(text):
            spans.append(
                RiskSpan(
                    start_char=m.start(),
                    end_char=m.end(),
                    matched_text=m.group(0),
                    category="VOICE",
                    severity=SeverityLevel.LOW,
                    explanation="Calls to action must name the product specifically rather than generic 'click here' or 'link in bio'.",
                    rule_citation="Brand Rule CIA-02 (Brand Book §5.1 Calls to action)",
                    suggested_fix="Shop Aurelle Radiant Glow Serum"
                )
            )

        # 8b. FACT-033: Embargoed Promotion / Diwali Sale
        if ("launch embargo" in lower_text or "pre-release diwali" in lower_text):
            m_diwali = re.search(r"\b(?:our\s+)?diwali\s+sale(?:\s+is\s+here)?\b", text, re.IGNORECASE)
            if m_diwali and not any(s.start_char <= m_diwali.start() and s.end_char >= m_diwali.end() for s in spans):
                spans.append(
                    RiskSpan(
                        start_char=m_diwali.start(),
                        end_char=m_diwali.end(),
                        matched_text=m_diwali.group(0),
                        category="PROMOTION",
                        severity=SeverityLevel.CRITICAL,
                        explanation="Announcing the Diwali festive sale violates commercial launch embargo in effect until approved release window (FACT-033).",
                        rule_citation="Approved Fact FACT-033 (Commercial Campaign Embargo Schedule)",
                        suggested_fix="Coming Soon: Festive Collection Preview"
                    )
                )

        # 8c. FACT-AUR-EXP-01: Lapsed Founder Promotion Tier
        if "founder launch trial" in lower_text or ("₹0" in lower_text and "founder" in lower_text) or "free for 6 months" in lower_text:
            m_exp = re.search(r"\b(?:₹0\s+free\s+for\s+6\s+months|founder\s+launch\s+trial|free\s+for\s+6\s+months)\b", text, re.IGNORECASE)
            if m_exp:
                spans.append(
                    RiskSpan(
                        start_char=m_exp.start(),
                        end_char=m_exp.end(),
                        matched_text=m_exp.group(0),
                        category="PROMOTION",
                        severity=SeverityLevel.HIGH,
                        explanation="Reference relies on an expired promotional tier that lapsed on Dec 31, 2025 (FACT-AUR-EXP-01).",
                        rule_citation="Approved Fact FACT-AUR-EXP-01 (Status: EXPIRED Dec 31, 2025)",
                        suggested_fix="Aurelle Cloud Studio subscription starting at ₹499/month"
                    )
                )

        # 8d. GL-AUR-04: Battery Specification Disclosure
        if ("72-hour" in lower_text or "72 hours" in lower_text) and "battery" in lower_text and "iec" not in lower_text:
            m_bat = re.search(r"\b72-?(?:hour|hours)\s+(?:continuous\s+)?battery(?:\s+life)?\b", text, re.IGNORECASE)
            if m_bat:
                spans.append(
                    RiskSpan(
                        start_char=m_bat.start(),
                        end_char=m_bat.end(),
                        matched_text=m_bat.group(0),
                        category="SPECIFICATION",
                        severity=SeverityLevel.HIGH,
                        explanation="72-hour battery claims require mandatory IEC 62133 standardized lab protocol disclosure footnote.",
                        rule_citation="Brand Guideline GL-AUR-04 (Battery Life Statutory Testing Disclosure)",
                        suggested_fix=f"{m_bat.group(0)}* (*Tested under IEC 62133 standardized lab protocol)"
                    )
                )

        # 8e. GL-AUR-01: Logo Safe-Zone Clearance (< 20px)
        if "12px" in lower_text and ("clearance" in lower_text or "padding" in lower_text or "margin" in lower_text):
            m_clr = re.search(r"\b12px(?:\s+padding)?\s+clearance\b", text, re.IGNORECASE)
            if m_clr:
                spans.append(
                    RiskSpan(
                        start_char=m_clr.start(),
                        end_char=m_clr.end(),
                        matched_text=m_clr.group(0),
                        category="VISUAL_IDENTITY",
                        severity=SeverityLevel.HIGH,
                        explanation="Logo margin clearance of 12px violates the mandatory minimum safe-zone threshold of 20px around the Aurelle wordmark.",
                        rule_citation="Brand Guideline GL-AUR-01 (Logo Safe Zone Clearance Mandate)",
                        suggested_fix="20px margin clearance around Aurelle wordmark"
                    )
                )

        # 8f. GL-AUR-02: Off-Palette Hue (#FF5500 / Neon Orange)
        if "#ff5500" in lower_text or "neon orange" in lower_text:
            m_col = re.search(r"\b(?:neon\s+orange\s+)?#FF5500\b", text, re.IGNORECASE)
            if m_col:
                spans.append(
                    RiskSpan(
                        start_char=m_col.start(),
                        end_char=m_col.end(),
                        matched_text=m_col.group(0),
                        category="VISUAL_IDENTITY",
                        severity=SeverityLevel.HIGH,
                        explanation="Detected unauthorized off-palette hue '#FF5500' (Neon Orange). Deviates from authorized palette: Obsidian Black (#0A0E1A) and Champagne Gold (#D4AF37).",
                        rule_citation="Brand Guideline GL-AUR-02 (Approved Master Color Palette)",
                        suggested_fix="Champagne Gold (#D4AF37)"
                    )
                )

        # 9. Style: GM07 (Website/Internet capitalization)
        gm07_pattern = re.compile(r"(?<=[a-zA-Z0-9,\s])\b(Website|Internet|Online|Email)\b")
        for m in gm07_pattern.finditer(text):
            spans.append(
                RiskSpan(
                    start_char=m.start(),
                    end_char=m.end(),
                    matched_text=m.group(1),
                    category="VOICE",
                    severity=SeverityLevel.LOW,
                    explanation="Don't capitalise website, internet, online or email mid-sentence.",
                    rule_citation="Brand Rule GM07 (Aurelle Brand Book v1.3 §8 Style)",
                    suggested_fix=m.group(1).lower()
                )
            )

        # 9b. Style: GM06 (Email addresses and URLs in lowercase)
        url_matches = list(re.finditer(r"\b((?:https?://|www\.)[a-zA-Z0-9.\-_/]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b", text, re.IGNORECASE))
        for m in url_matches:
            url_str = m.group(0)
            if any(c.isupper() for c in url_str):
                spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=url_str,
                        category="VOICE",
                        severity=SeverityLevel.LOW,
                        explanation="Email addresses and URLs in lowercase",
                        rule_citation="Brand Rule GM06 (Aurelle Brand Book v1.3 §8 Style)",
                        suggested_fix=url_str.lower()
                    )
                )

        # 9c. Style: GM08 (Format numbers over 999 with commas)
        num_matches = list(re.finditer(r"\b(\d{4,9})\b", text))
        for m in num_matches:
            num_str = m.group(1)
            val = int(num_str)
            if val not in [2024, 2025, 2026, 2027]:
                formatted = f"{val:,}"
                spans.append(
                    RiskSpan(
                        start_char=m.start(),
                        end_char=m.end(),
                        matched_text=num_str,
                        category="VOICE",
                        severity=SeverityLevel.LOW,
                        explanation=f"Format numbers over 999 with commas ({formatted}) and verify claim against customer ledger.",
                        rule_citation="Brand Rule GM08 (Aurelle Brand Book v1.3 §8 Style)",
                        suggested_fix=formatted
                    )
                )

        # 10. Missing mandatory key phrases (if specified by Creator)
        if key_phrases and key_phrases.strip():
            req_phrases = [p.strip() for p in key_phrases.split(",") if p.strip()]
            for p in req_phrases:
                if p.lower() not in lower_text:
                    spans.append(
                        RiskSpan(
                            start_char=0,
                            end_char=min(len(text), 15),
                            matched_text=text[:min(len(text), 15)],
                            category="VOICE",
                            severity=SeverityLevel.MODERATE,
                            explanation=f"Missing required key phrase '{p}' specified in post requirements.",
                            rule_citation="Content Brief Directive: Mandatory Key Phrases",
                            suggested_fix=f"{text[:min(len(text), 15)]} [{p}]"
                        )
                    )

        # 11. Missing Call to Action (if specified by Creator)
        if cta and cta.strip():
            if cta.strip().lower() not in lower_text:
                spans.append(
                    RiskSpan(
                        start_char=max(0, len(text) - 10),
                        end_char=len(text),
                        matched_text=text[max(0, len(text) - 10):],
                        category="VOICE",
                        severity=SeverityLevel.MODERATE,
                        explanation=f"Missing required call to action '{cta.strip()}'.",
                        rule_citation="Content Brief Directive: Required Call to Action",
                        suggested_fix=f"{text[max(0, len(text) - 10):]} {cta.strip()}"
                    )
                )

        return spans

    def _build_sentence_findings(self, content: str, all_spans: List[RiskSpan]) -> List[Dict[str, Any]]:
        sentence_matches = list(re.finditer(r'[^.!?\n]+(?:[.!?\n]|$)', content))
        if not sentence_matches:
            sentence_matches = [re.match(r'.*', content)]

        sentence_findings = []
        finding_idx = 1

        for span in all_spans:
            enclosing_sentence = ""
            for sm in sentence_matches:
                if sm and sm.start() <= span.start_char <= sm.end():
                    enclosing_sentence = sm.group(0).strip()
                    break
            if not enclosing_sentence:
                enclosing_sentence = content[max(0, span.start_char - 40):min(len(content), span.end_char + 40)].strip()

            if span.severity == SeverityLevel.CRITICAL:
                sev_str = "BLOCKING"
            elif span.severity == SeverityLevel.HIGH:
                sev_str = "MAJOR"
            elif span.severity == SeverityLevel.MODERATE:
                sev_str = "MINOR"
            else:
                sev_str = "ADVISORY"

            needs_human = "medical" in span.category.lower() or "human" in span.explanation.lower() or span.severity == SeverityLevel.CRITICAL

            rule_id = "RULE-01"
            if "FACT-" in span.rule_citation:
                m_rule = re.search(r"FACT-[A-Za-z0-9-]+", span.rule_citation)
                if m_rule:
                    rule_id = m_rule.group(0)
            elif "REG-" in span.rule_citation:
                m_rule = re.search(r"REG-[A-Za-z0-9-]+", span.rule_citation)
                if m_rule:
                    rule_id = m_rule.group(0)
            elif "GL-" in span.rule_citation:
                m_rule = re.search(r"GL-[A-Za-z0-9-]+", span.rule_citation)
                if m_rule:
                    rule_id = m_rule.group(0)
            elif "DL-" in span.rule_citation:
                m_rule = re.search(r"DL-[A-Za-z0-9-]+", span.rule_citation)
                if m_rule:
                    rule_id = m_rule.group(0)
            elif "CIA-" in span.rule_citation:
                m_rule = re.search(r"CIA-[A-Za-z0-9-]+", span.rule_citation)
                if m_rule:
                    rule_id = m_rule.group(0)
            elif "GM" in span.rule_citation:
                m_rule = re.search(r"GM[0-9]+", span.rule_citation)
                if m_rule:
                    rule_id = m_rule.group(0)
            elif "TM-" in span.rule_citation:
                m_rule = re.search(r"TM-[A-Za-z0-9-]+", span.rule_citation)
                if m_rule:
                    rule_id = m_rule.group(0)
            elif "Writing Standard" in span.rule_citation or "Editorial Style" in span.rule_citation or "WQ-" in span.rule_citation:
                rule_id = "WQ-01"

            suggested_sentence = enclosing_sentence
            if span.suggested_fix and span.matched_text and span.matched_text in enclosing_sentence:
                suggested_sentence = enclosing_sentence.replace(span.matched_text, span.suggested_fix, 1)

            m_fact = re.search(r"FACT-[A-Za-z0-9-]+", span.rule_citation)
            fact_id = m_fact.group(0) if m_fact else None

            expl_lower = span.explanation.lower()
            if fact_id or span.category.upper() == "CLAIM":
                if "contradict" in expl_lower or "conflict" in expl_lower:
                    claim_classification = "CONTRADICTED"
                elif "unsupported" in expl_lower or "no fact" in expl_lower or "unsubstantiat" in expl_lower:
                    claim_classification = "UNSUPPORTED"
                elif "expired" in expl_lower or "outdated" in expl_lower:
                    claim_classification = "EXPIRED"
                elif "supported" in expl_lower or "verified" in expl_lower:
                    claim_classification = "SUPPORTED"
                else:
                    claim_classification = "NEEDS_HUMAN_REVIEW"
            elif "REG-" in span.rule_citation or "compliance" in span.category.lower() or "regulatory" in span.category.lower():
                claim_classification = "COMPLIANCE"
            elif "GL-" in span.rule_citation or "TM-" in span.rule_citation or "guideline" in span.category.lower():
                claim_classification = "BRAND_RULE"
            else:
                claim_classification = "NEEDS_HUMAN_REVIEW"

            rule_title = span.rule_citation.split("(")[0].strip() if "(" in span.rule_citation else span.rule_citation
            evidence_ref = span.rule_citation
            if rule_id == "DL-01":
                rule_title = 'Offers and discounts need "T&Cs apply"'
                evidence_ref = "SOURCE Aurelle Brand Book v1.3 §7.3 Promotions"
            elif rule_id == "GM06":
                rule_title = "Email addresses and URLs in lowercase"
                evidence_ref = "SOURCE Aurelle Brand Book v1.3 §8 Style (GM06)"
            elif rule_id == "GM07":
                rule_title = "Don't capitalise online mid-sentence"
                evidence_ref = "SOURCE Aurelle Brand Book v1.3 §8 Style (GM07)"
            elif rule_id == "GM08":
                rule_title = "Format numbers over 999 with commas"
                evidence_ref = "SOURCE Aurelle Brand Book v1.3 §8 Style (GM08)"
            elif rule_id == "FACT-014":
                rule_title = "Clinical Evidence Substantiation"
                evidence_ref = "SOURCE Aurelle Clinical Protocol AUR-LAB-014 (FACT-014)"
            elif rule_id == "FACT-006":
                rule_title = "Authorized Commercial Pricing Schedule"
                evidence_ref = "SOURCE Aurelle Commercial Pricing Schedule (FACT-006)"
            elif rule_id == "WQ-01":
                rule_title = "Editorial Grammar & Style Standard"
                evidence_ref = "SOURCE Editorial Style & Writing Standard"
            elif not evidence_ref.startswith("SOURCE"):
                evidence_ref = f"SOURCE {evidence_ref}"

            finding_item = {
                "id": f"f-{finding_idx}",
                "number": finding_idx,
                "sentence_text": enclosing_sentence,
                "flagged_text": span.matched_text,
                "category": "Mandatory required" if rule_id == "DL-01" else ("Brand style" if rule_id.startswith("GM") else span.category),
                "severity": sev_str,
                "rule_id": rule_id,
                "fact_id": fact_id,
                "claim_classification": claim_classification,
                "evidence": evidence_ref,
                "evidence_ref": evidence_ref,
                "source": evidence_ref,
                "rule_title": rule_title,
                "explanation": span.explanation,
                "suggested_fix": span.suggested_fix or "",
                "suggested_sentence": suggested_sentence,
                "evidence_ref": evidence_ref,
                "needs_human_review": needs_human,
                "decision": "UNDECIDED",
                "overrule_reason": "",
                "resolved": False,
                "start_char": span.start_char,
                "end_char": span.end_char
            }
            sentence_findings.append(finding_item)
            finding_idx += 1

        return sentence_findings

    # Alias for API uniformity
    analyze_asset = verify_asset

governance_pipeline = AutonomousGovernancePipeline()

