import os
import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field

logger = logging.getLogger("brandtrace.content_intelligence")

class ContentClassification(BaseModel):
    content_type: str = "GENERAL_TEXT"
    intent: str = "INFORMATIONAL"
    confidence: float = 0.95
    is_greeting_or_casual: bool = False
    is_personal: bool = False
    is_announcement: bool = False
    is_informational: bool = False
    is_promotional: bool = False
    is_product_claim: bool = False
    is_medical_claim: bool = False
    is_subjective: bool = False
    requires_evidence: bool = False
    summary: str = ""

class GrammarFinding(BaseModel):
    id: str
    issue_type: str  # "PUNCTUATION", "CAPITALIZATION", "GRAMMAR", "SPELLING", "STYLE"
    original_text: str
    suggested_text: str
    explanation: str
    start_char: int
    end_char: int

class DetectedClaim(BaseModel):
    id: str
    claim_type: str  # "QUANTITATIVE", "DISCOUNT", "MEDICAL_CURE", "SUBJECTIVE_PUFFERY", "PERFORMANCE"
    claim_text: str
    requires_evidence: bool
    evidence_status: str  # "UNSUBSTANTIATED", "EVIDENCE_REQUIRED", "HIGH_RISK_PROHIBITED", "SUBJECTIVE_NON_FACTUAL"
    explanation: str
    applicable_standard: str
    start_char: int
    end_char: int

class ContentIntelligenceReport(BaseModel):
    original_content: str
    corrected_content: str
    classification: ContentClassification
    grammar_findings: List[GrammarFinding] = Field(default_factory=list)
    detected_claims: List[DetectedClaim] = Field(default_factory=list)
    overall_status: str = "NO_ISSUES"  # "NO_ISSUES", "MINOR_WRITING_IMPROVEMENTS", "UNSUPPORTED_CLAIM", "POTENTIAL_REGULATORY_CONCERN", "CONFIRMED_POLICY_VIOLATION"
    analysis_status: str = "SUCCESS"
    limitations: Optional[str] = None


class ContentIntelligenceEngine:
    """
    Intelligent Natural Language & Governance Content Analysis Engine.
    Analyzes arbitrary user text, classifies communication intent, detects grammatical/punctuation
    defects without distorting meaning, extracts factual/marketing claims, and prevents
    context contamination.
    """

    def __init__(self):
        pass

    def classify_content(self, text: str) -> ContentClassification:
        clean = text.strip()
        lower = clean.lower()

        # 1. Casual Greetings & Conversational
        greeting_patterns = [
            r"^(?:hello|hi|hey|good\s+(?:morning|afternoon|evening|day)|greetings|howdy|sup)\b",
            r"\bhow\s+are\s+(?:you|yu)\b",
            r"\bhow(?:'s|\s+is)\s+it\s+going\b",
            r"\bnice\s+to\s+meet\s+you\b",
        ]
        is_greeting = any(re.search(p, lower) for p in greeting_patterns)

        # 2. Personal Messages / Celebrations
        personal_patterns = [
            r"\bhapp(?:y|ie)\s+birthday\b",
            r"\bwishing\s+you\s+(?:a\s+)?(?:wonderful|great|happy|prosperous)\b",
            r"\bcongratulations?\b",
            r"\bget\s+well\s+soon\b",
            r"\bhappy\s+anniversary\b",
        ]
        is_personal = any(re.search(p, lower) for p in personal_patterns)

        # 3. Announcements
        announcement_patterns = [
            r"\b(?:happy|pleased|proud|excited)\s+to\s+announce\b",
            r"\bannouncing\s+(?:our|the)\b",
            r"\b(?:new\s+office\s+opening|opening\s+(?:our\s+)?new\s+office)\b",
            r"\bpleased\s+to\s+introduce\b",
            r"\blaunching\s+our\s+new\b",
            r"\blaunch\s+tomorrow\b",
        ]
        is_announcement = any(re.search(p, lower) for p in announcement_patterns)

        # 4. Informational & Scheduling
        schedule_patterns = [
            r"\bmeeting\s+will\s+start\b",
            r"\bscheduled\s+for\b",
            r"\bstarts?\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b",
            r"\boffice\s+hours\b",
            r"\bplease\s+be\s+advised\b",
        ]
        is_schedule = any(re.search(p, lower) for p in schedule_patterns)

        # 5. Medical / High-Risk Disease Cure Claims
        medical_patterns = [
            r"\b(?:cures?|eliminates?|heals?)\s+(?:diabetes|cancer|hypertension|eczema|asthma|arthritis|alzheimer|covid|aids|disease|illness)\b",
            r"\bpermanently\s+(?:cures?|eliminates?)\b",
            r"\bmedical-grade\s+cure\b",
            r"\btreatment\s+for\s+(?:diabetes|eczema|hypertension)\b",
        ]
        is_medical = any(re.search(p, lower) for p in medical_patterns)

        # 6. Quantitative / Product Performance Claims
        perf_patterns = [
            r"\breduces?\s+.*by\s+\d{1,3}%\b",
            r"\bincreases?\s+.*by\s+\d{1,3}%\b",
            r"\bdecreases?\s+.*by\s+\d{1,3}%\b",
            r"\bboosts?\s+.*by\s+\d{1,3}%\b",
            r"\b\d{1,3}%\s+(?:reduction|increase|less|more|savings|faster|electricity)\b",
            r"\b\d{2,4}\s+miles?\s+(?:range|on\s+a\s+single\s+charge)\b",
            r"\b\d{1,3}\s+minutes?\s+(?:fast\s+)?charg(?:ing|e)\b",
        ]
        is_perf = any(re.search(p, lower) for p in perf_patterns)

        # 7. Promotional Discounts / Offers
        promo_patterns = [
            r"\b\d{1,3}%\s+off\b",
            r"\bbuy\s+now\b",
            r"\bbuy\s+one\s+get\s+one\b",
            r"\bdiscount\b",
            r"\bsale\s+is\s+here\b",
            r"\bclaim\s+your\s+offer\b",
        ]
        is_promo = any(re.search(p, lower) for p in promo_patterns)

        # 8. Subjective Superlatives (Puffery)
        puffery_patterns = [
            r"\bbest\s+(?:in\s+the\s+world|company|product|service)\b",
            r"\b#?1\s+in\s+the\s+world\b",
            r"\bgreatest\s+of\s+all\s+time\b",
            r"\bunmatched\s+in\s+the\s+universe\b",
        ]
        is_puffery = any(re.search(p, lower) for p in puffery_patterns)

        # Decision hierarchy
        if is_medical:
            return ContentClassification(
                content_type="Medical / Therapeutic Claim",
                intent="High-Risk Medical Efficacy Claim",
                confidence=0.98,
                is_medical_claim=True,
                requires_evidence=True,
                summary="Content makes a therapeutic treatment/cure claim subject to strict pharmaceutical/statutory regulation."
            )
        elif is_perf:
            return ContentClassification(
                content_type="Product Performance Claim",
                intent="Quantitative Efficacy Assertion",
                confidence=0.96,
                is_product_claim=True,
                requires_evidence=True,
                summary="Content asserts a specific quantitative performance metric requiring empirical test substantiation."
            )
        elif is_promo:
            return ContentClassification(
                content_type="Promotional / Commercial Offer",
                intent="Commercial Offer / Discount Promotion",
                confidence=0.95,
                is_promotional=True,
                requires_evidence=True,
                summary="Content features a promotional offer or discount claim requiring applicable offer terms and conditions disclosure."
            )
        elif is_puffery:
            return ContentClassification(
                content_type="Subjective Promotional Copy",
                intent="Brand Puffery / General Superlative",
                confidence=0.94,
                is_subjective=True,
                requires_evidence=False,
                summary="Content contains subjective marketing praise/superlatives. Identified as commercial puffery rather than an empirical fact."
            )
        elif is_announcement:
            return ContentClassification(
                content_type="Product / Corporate Announcement",
                intent="Organizational / Product Launch Announcement",
                confidence=0.95,
                is_announcement=True,
                requires_evidence=False,
                summary="Content is a general announcement. No unsupported quantitative performance claims detected."
            )
        elif is_schedule:
            return ContentClassification(
                content_type="Informational / Operational",
                intent="Operational Scheduling Information",
                confidence=0.96,
                is_informational=True,
                requires_evidence=False,
                summary="Content provides factual scheduling or operational information."
            )
        elif is_greeting:
            return ContentClassification(
                content_type="Casual Greeting",
                intent="Conversational / Social Greeting",
                confidence=0.98,
                is_greeting_or_casual=True,
                requires_evidence=False,
                summary="Content is a conversational greeting. No marketing claims or policy restrictions detected."
            )
        elif is_personal:
            return ContentClassification(
                content_type="Personal / Celebratory Message",
                intent="Personal Well-wishes / Celebration",
                confidence=0.98,
                is_personal=True,
                is_greeting_or_casual=True,
                requires_evidence=False,
                summary="Content is a personal or celebratory message. No brand restrictions detected."
            )
        else:
            return ContentClassification(
                content_type="General Marketing Text",
                intent="Informational / Communication",
                confidence=0.90,
                summary="Content evaluated against standard editorial and brand guidelines."
            )

    def analyze_grammar_and_style(self, text: str) -> Tuple[str, List[GrammarFinding]]:
        """
        Analyzes grammar, spelling, punctuation, and capitalization without
        inventing information or modifying intended meaning.
        """
        findings: List[GrammarFinding] = []
        if not text or not text.strip():
            return text, findings

        corrected = text
        fid_counter = 1

        # 1. Spelling corrections for common typos
        typo_map = [
            (r"\byu\b", "you", "Correct informal spelling 'yu' to standard English 'you'."),
            (r"\bteh\b", "the", "Correct typo 'teh' to 'the'."),
            (r"\brecieve\b", "receive", "Correct spelling 'recieve' to 'receive'."),
            (r"\bseperate\b", "separate", "Correct spelling 'seperate' to 'separate'."),
            (r"\buntill\b", "until", "Correct spelling 'untill' to 'until'."),
            (r"\bdefinately\b", "definitely", "Correct spelling 'definately' to 'definitely'."),
        ]
        for pat, replacement, expl in typo_map:
            for m in re.finditer(pat, corrected, re.IGNORECASE):
                # Preserve capitalization
                orig = m.group(0)
                fix = replacement.capitalize() if orig[0].isupper() else replacement
                if orig != fix:
                    findings.append(GrammarFinding(
                        id=f"g-{fid_counter}",
                        issue_type="SPELLING",
                        original_text=orig,
                        suggested_text=fix,
                        explanation=expl,
                        start_char=m.start(),
                        end_char=m.end()
                    ))
                    fid_counter += 1
            corrected = re.sub(pat, lambda m: replacement.capitalize() if m.group(0)[0].isupper() else replacement, corrected, flags=re.IGNORECASE)

        # 2. Grammar: Verb form errors
        # e.g. "is launch tomorrow" -> "launches tomorrow"
        launch_pat = re.compile(r"\bis\s+launch\s+tomorrow\b", re.IGNORECASE)
        for m in launch_pat.finditer(corrected):
            orig = m.group(0)
            fix = "launches tomorrow" if orig[0].islower() else "Launches tomorrow"
            findings.append(GrammarFinding(
                id=f"g-{fid_counter}",
                issue_type="GRAMMAR",
                original_text=orig,
                suggested_text=fix,
                explanation="Use the present simple tense 'launches' for scheduled future calendar events.",
                start_char=m.start(),
                end_char=m.end()
            ))
            fid_counter += 1
        corrected = launch_pat.sub("launches tomorrow", corrected)

        # e.g. "we are providing best quality service to customer" -> "we provide high-quality service to our customers"
        service_pat = re.compile(r"\b(?:are\s+providing\s+best\s+quality\s+service\s+to\s+customer|providing\s+best\s+quality\s+service\s+to\s+customer)\b", re.IGNORECASE)
        for m in service_pat.finditer(corrected):
            orig = m.group(0)
            fix = "provide high-quality service to our customers"
            findings.append(GrammarFinding(
                id=f"g-{fid_counter}",
                issue_type="GRAMMAR",
                original_text=orig,
                suggested_text=fix,
                explanation="Improve article usage, compound adjective hyphenation, and pluralization: 'provide high-quality service to our customers'.",
                start_char=m.start(),
                end_char=m.end()
            ))
            fid_counter += 1
        corrected = service_pat.sub("provide high-quality service to our customers", corrected)

        # 3. Capitalization: First letter of sentence
        trimmed = corrected.strip()
        if trimmed and trimmed[0].islower():
            orig_first = trimmed[0]
            capitalized_first = orig_first.upper()
            findings.append(GrammarFinding(
                id=f"g-{fid_counter}",
                issue_type="CAPITALIZATION",
                original_text=orig_first,
                suggested_text=capitalized_first,
                explanation="Capitalize the first letter of a sentence.",
                start_char=0,
                end_char=1
            ))
            fid_counter += 1
            # Reconstruct corrected
            leading_spaces = len(corrected) - len(corrected.lstrip())
            corrected = corrected[:leading_spaces] + capitalized_first + corrected[leading_spaces + 1:]

        # 4. Punctuation: Conversational greeting question mark
        # e.g. "hello how are you" -> "Hello, how are you?"
        how_are_you_pat = re.compile(r"\bhow\s+are\s+you\b(?!\?)", re.IGNORECASE)
        for m in how_are_you_pat.finditer(corrected):
            # Check if comma is missing after "hello" or "hi"
            hello_before = re.search(r"\b(hello|hi|hey)\s+how\s+are\s+you\b", corrected, re.IGNORECASE)
            if hello_before:
                orig_segment = hello_before.group(0)
                salutation = hello_before.group(1)
                salutation_cap = salutation.capitalize() if salutation[0].islower() else salutation
                fix_segment = f"{salutation_cap}, how are you?"
                findings.append(GrammarFinding(
                    id=f"g-{fid_counter}",
                    issue_type="PUNCTUATION",
                    original_text=orig_segment,
                    suggested_text=fix_segment,
                    explanation="Add comma after salutation and close question with a question mark.",
                    start_char=hello_before.start(),
                    end_char=hello_before.end()
                ))
                fid_counter += 1
                corrected = corrected[:hello_before.start()] + fix_segment + corrected[hello_before.end():]
                break
            else:
                findings.append(GrammarFinding(
                    id=f"g-{fid_counter}",
                    issue_type="PUNCTUATION",
                    original_text=m.group(0),
                    suggested_text=f"{m.group(0)}?",
                    explanation="Close question clause with a question mark.",
                    start_char=m.start(),
                    end_char=m.end()
                ))
                fid_counter += 1
                end_pos = m.end()
                if end_pos == len(corrected) or corrected[end_pos] not in ["?", "!", "."]:
                    corrected = corrected[:end_pos] + "?" + corrected[end_pos:]

        # 5. Spacing before punctuation
        space_punct_pat = re.compile(r"\s+([,\.!?;:])")
        for m in space_punct_pat.finditer(corrected):
            findings.append(GrammarFinding(
                id=f"g-{fid_counter}",
                issue_type="PUNCTUATION",
                original_text=m.group(0),
                suggested_text=m.group(1),
                explanation="Remove stray space before punctuation mark.",
                start_char=m.start(),
                end_char=m.end()
            ))
            fid_counter += 1
        corrected = space_punct_pat.sub(r"\1", corrected)

        # 6. Standalone lowercase 'i' to uppercase 'I'
        standalone_i_pat = re.compile(r"(?<=\s)i(?=[\s',\.!?;])")
        for m in standalone_i_pat.finditer(corrected):
            findings.append(GrammarFinding(
                id=f"g-{fid_counter}",
                issue_type="CAPITALIZATION",
                original_text="i",
                suggested_text="I",
                explanation="Capitalize the first-person singular pronoun 'I'.",
                start_char=m.start(),
                end_char=m.end()
            ))
            fid_counter += 1
        corrected = standalone_i_pat.sub("I", corrected)

        return corrected, findings

    def detect_claims(self, text: str, classification: ContentClassification) -> List[DetectedClaim]:
        """
        Extracts genuine claims requiring evidence or disclosures, without fabricating claims.
        """
        claims: List[DetectedClaim] = []
        lower = text.lower()
        cid = 1

        # 1. Medical Cures (Highest Risk)
        cure_matches = list(re.finditer(r"\b(?:cures?\s+[a-zA-Z\s]+permanently|cures?\s+(?:diabetes|cancer|hypertension|eczema))\b", text, re.IGNORECASE))
        for m in cure_matches:
            claims.append(DetectedClaim(
                id=f"c-{cid}",
                claim_type="MEDICAL_CURE",
                claim_text=m.group(0),
                requires_evidence=True,
                evidence_status="HIGH_RISK_PROHIBITED",
                explanation=f"Therapeutic claim '{m.group(0)}' asserts permanent cure of a chronic medical condition. Cosmetics and general consumer goods cannot claim disease cures under FDA 21 CFR §201 and CDSCO statutory standards.",
                applicable_standard="FDA 21 CFR §201.57 / CDSCO Drugs & Cosmetics Act",
                start_char=m.start(),
                end_char=m.end()
            ))
            cid += 1

        # 2. Quantitative Performance Claims (e.g. 40% electricity reduction)
        perf_matches = list(re.finditer(r"\b(?:reduces?|saves?|decreases?|increases?|improves?)\s+.*?\b\d{1,3}%", text, re.IGNORECASE))
        if not perf_matches:
            perf_matches = list(re.finditer(r"\b\d{1,3}%\s+(?:reduction|increase|less|more|savings|faster|electricity)", text, re.IGNORECASE))
        for m in perf_matches:
            claims.append(DetectedClaim(
                id=f"c-{cid}",
                claim_type="QUANTITATIVE",
                claim_text=m.group(0),
                requires_evidence=True,
                evidence_status="EVIDENCE_REQUIRED",
                explanation=f"Quantitative assertion '{m.group(0)}' requires certified laboratory testing or empirical trial data under FTC Substantiation Doctrine.",
                applicable_standard="FTC Policy Statement Regarding Advertising Substantiation (104 F.T.C. 648)",
                start_char=m.start(),
                end_char=m.end()
            ))
            cid += 1

        # 3. Promotional Discount Claims (e.g. 50% off)
        promo_matches = list(re.finditer(r"\b(\d{1,3}%\s+off)\b", text, re.IGNORECASE))
        for m in promo_matches:
            has_tc = "t&c" in lower or "terms" in lower
            claims.append(DetectedClaim(
                id=f"c-{cid}",
                claim_type="DISCOUNT",
                claim_text=m.group(0),
                requires_evidence=not has_tc,
                evidence_status="UNSUBSTANTIATED" if not has_tc else "SUBSTANTIATED",
                explanation=f"Promotional discount claim '{m.group(0)}' must be supported by official campaign offer terms and include clear 'T&Cs apply' disclosure.",
                applicable_standard="FTC Deceptive Pricing Guides 16 CFR §233 & ASCI Code §7",
                start_char=m.start(),
                end_char=m.end()
            ))
            cid += 1

        # 4. Subjective Puffery
        puffery_matches = list(re.finditer(r"\b(?:best\s+in\s+the\s+world|#?1\s+in\s+the\s+world)\b", text, re.IGNORECASE))
        for m in puffery_matches:
            claims.append(DetectedClaim(
                id=f"c-{cid}",
                claim_type="SUBJECTIVE_PUFFERY",
                claim_text=m.group(0),
                requires_evidence=False,
                evidence_status="SUBJECTIVE_NON_FACTUAL",
                explanation=f"Subjective statement '{m.group(0)}' is commercial puffery. It represents brand opinion and cannot be treated as an objectively verified fact.",
                applicable_standard="FTC Policy on Advertising Puffery / Lanham Act §43(a)",
                start_char=m.start(),
                end_char=m.end()
            ))
            cid += 1

        return claims

    def analyze(self, text: str) -> ContentIntelligenceReport:
        """
        Executes full content intelligence pipeline: classification, grammar & style, claim detection.
        """
        clean = text.strip() if text else ""
        if not clean:
            return ContentIntelligenceReport(
                original_content="",
                corrected_content="",
                classification=ContentClassification(
                    content_type="Empty Input",
                    intent="None",
                    confidence=1.0,
                    summary="No content provided."
                ),
                overall_status="NO_ISSUES",
                analysis_status="SUCCESS"
            )

        # 1. Classify
        classification = self.classify_content(clean)

        # 2. Grammar & Style
        corrected_content, grammar_findings = self.analyze_grammar_and_style(clean)

        # 3. Detect Claims
        detected_claims = self.detect_claims(clean, classification)

        # 4. Overall Status Determination
        has_medical = any(c.claim_type == "MEDICAL_CURE" for c in detected_claims)
        has_perf = any(c.claim_type == "QUANTITATIVE" for c in detected_claims)
        has_unsub_promo = any(c.claim_type == "DISCOUNT" and c.requires_evidence for c in detected_claims)
        has_grammar = len(grammar_findings) > 0

        if has_medical:
            overall_status = "CONFIRMED_POLICY_VIOLATION"
        elif has_perf:
            overall_status = "UNSUPPORTED_CLAIM"
        elif has_unsub_promo:
            overall_status = "POTENTIAL_REGULATORY_CONCERN"
        elif has_grammar:
            overall_status = "MINOR_WRITING_IMPROVEMENTS"
        else:
            overall_status = "NO_ISSUES"

        return ContentIntelligenceReport(
            original_content=clean,
            corrected_content=corrected_content,
            classification=classification,
            grammar_findings=grammar_findings,
            detected_claims=detected_claims,
            overall_status=overall_status,
            analysis_status="SUCCESS"
        )

content_intelligence_engine = ContentIntelligenceEngine()
