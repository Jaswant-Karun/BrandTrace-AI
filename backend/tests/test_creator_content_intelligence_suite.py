import pytest
from brandtrace.agents.pipeline import AutonomousGovernancePipeline
from brandtrace.agents.schema import VerificationRequest
from brandtrace.graph.engine import BrandKnowledgeGraph
from brandtrace.engine.content_intelligence import content_intelligence_engine


@pytest.fixture
def pipeline():
    return AutonomousGovernancePipeline()


@pytest.fixture
def bkg():
    return BrandKnowledgeGraph(brand_id="aurelle-tech", brand_name="Aurelle Skin")


class TestCreatorContentIntelligenceSuite:
    """
    Validation Suite for Section 13: 15 Mandatory Creator AI Content Intelligence Tests.
    Ensures arbitrary/custom user content is analyzed accurately without hallucinations or false campaign associations.
    """

    # Test Case 1: Casual greeting without capitalization or punctuation
    def test_case_01_casual_greeting_unformatted(self, pipeline, bkg):
        text = "hello how are you"
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        assert res.content_type == "Casual Greeting"
        assert "Conversational" in (res.intent or "")
        # Zero blocking violations
        assert res.summary_counts["blocking"] == 0
        assert res.verdict_badge == "READY FOR REVIEW"
        # Must not associate with Diwali or any commercial sale campaign
        assert "diwali" not in (res.remediated_content or "").lower()
        assert "diwali" not in str(res.all_risk_spans).lower()
        # Remediated content should have proper capitalization and question mark
        assert "Hello, how are you?" in (res.remediated_content or "")

    # Test Case 2: Clean, grammatically correct casual greeting
    def test_case_02_casual_greeting_clean(self, pipeline, bkg):
        text = "Hello, how are you?"
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        assert res.content_type == "Casual Greeting"
        assert res.summary_counts["blocking"] == 0
        assert len(res.all_risk_spans) == 0
        assert res.composite_risk_score == 0.0
        assert res.governance_decision == "APPROVED_FOR_RELEASE"
        assert res.verdict_badge == "READY FOR REVIEW"
        assert res.remediated_content == text

    # Test Case 3: Announcement with grammatical verb-tense error
    def test_case_03_announcement_with_tense_error(self, pipeline, bkg):
        text = "our new product is launch tomorrow"
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        assert res.content_type == "Product / Corporate Announcement"
        assert res.summary_counts["blocking"] == 0
        # Corrects "is launch tomorrow" to "launches tomorrow" or capitalizes sentence
        assert "launches tomorrow" in res.remediated_content.lower()
        assert "diwali" not in res.remediated_content.lower()

    # Test Case 4: Promotional discount requiring mandatory statutory terms (DL-01)
    def test_case_04_promotional_discount(self, pipeline, bkg):
        text = "Buy now and get 50% off."
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        # DL-01 requires terms disclosure for promotional discounts
        assert res.summary_counts["blocking"] > 0
        has_promo_finding = any(
            "DL-01" in s.rule_citation or "T&Cs" in s.explanation or "Promotions" in s.explanation
            for s in res.all_risk_spans
        )
        assert has_promo_finding
        assert "t&cs apply" in res.remediated_content.lower() or "terms" in res.remediated_content.lower()

    # Test Case 5: Quantitative performance claim without evidence
    def test_case_05_quantitative_performance_claim(self, pipeline, bkg):
        text = "Our product reduces electricity consumption by 40%."
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        # Must detect quantitative efficacy claim requiring substantiation
        has_quant_claim = any(
            "40%" in s.matched_text and s.category == "CLAIM"
            for s in res.all_risk_spans
        )
        assert has_quant_claim
        assert res.overall_status in ["UNSUPPORTED_CLAIM", "CONFIRMED_POLICY_VIOLATION"]

    # Test Case 6: Non-cosmetic corporate announcement
    def test_case_06_corporate_announcement(self, pipeline, bkg):
        text = "We are happy to announce our new office opening."
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        assert res.content_type == "Product / Corporate Announcement"
        assert res.summary_counts["blocking"] == 0
        assert res.verdict_badge == "READY FOR REVIEW"
        # No skincare/Vitamin C claims injected
        assert "vitamin c" not in res.remediated_content.lower()
        assert "diwali" not in res.remediated_content.lower()

    # Test Case 7: Informational meeting schedule
    def test_case_07_informational_schedule(self, pipeline, bkg):
        text = "The meeting will start at 10 AM tomorrow."
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        assert res.content_type == "Informational / Operational"
        assert res.summary_counts["blocking"] == 0
        assert res.verdict_badge == "READY FOR REVIEW"

    # Test Case 8: Personal celebratory message
    def test_case_08_personal_celebration(self, pipeline, bkg):
        text = "Happy birthday! Wishing you a wonderful year ahead."
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        assert res.content_type == "Personal / Celebratory Message"
        assert res.summary_counts["blocking"] == 0
        assert len(res.all_risk_spans) == 0
        assert res.verdict_badge == "READY FOR REVIEW"

    # Test Case 9: Medical disease cure claim (prohibited under FDA/CDSCO)
    def test_case_09_medical_cure_claim(self, pipeline, bkg):
        text = "This medicine cures diabetes permanently."
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        assert res.summary_counts["blocking"] > 0
        has_cure_risk = any(
            "diabetes" in s.matched_text.lower() or "cure" in s.explanation.lower() or "disease" in s.explanation.lower()
            for s in res.all_risk_spans
        )
        assert has_cure_risk
        assert res.governance_decision == "REJECTED_GATED"
        assert res.overall_status == "CONFIRMED_POLICY_VIOLATION"

    # Test Case 10: Subjective commercial puffery
    def test_case_10_subjective_puffery(self, pipeline, bkg):
        text = "Our company is the best in the world."
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        # Puffery is subjective opinion, not a blocking regulatory violation
        assert res.summary_counts["blocking"] == 0
        has_puffery = any(
            "best in the world" in s.matched_text.lower() or "puffery" in s.explanation.lower() or "opinion" in s.explanation.lower()
            for s in res.all_risk_spans
        )
        assert has_puffery

    # Test Case 11: Empty / whitespace content handling
    def test_case_11_empty_input_handling(self, pipeline, bkg):
        text = "   "
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        assert res.summary_counts["blocking"] == 0
        assert res.verdict_badge == "READY FOR REVIEW"
        assert res.composite_risk_score == 0.0

    # Test Case 12: Phrasing and punctuation correction
    def test_case_12_phrasing_and_punctuation_correction(self, pipeline, bkg):
        text = "we are providing best quality service to customer ."
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        # Cleans up stray space before period and improves phrasing
        assert " ." not in res.remediated_content
        assert res.remediated_content.endswith(".")
        assert res.remediated_content[0].isupper()

    # Test Case 13: Standard Aurelle product launch post (identifies legitimate violations)
    def test_case_13_standard_aurelle_violations(self, pipeline, bkg):
        text = (
            "Meet the NEW Aurelle Vitamin-C serum! 100% natural, completely eco-friendly "
            "and clinically proven to fade dark spots by 60% in just 2 weeks. "
            "Available now at ₹499."
        )
        req = VerificationRequest(brand_id="aurelle-tech", content=text)
        res = pipeline.verify_asset(req, bkg)

        assert res.summary_counts["blocking"] >= 3
        assert res.verdict_badge == "CORRECTIONS REQUIRED"
        # Must catch 100% natural / eco-friendly (REG-01)
        assert any("natural" in s.matched_text.lower() for s in res.all_risk_spans)
        # Must catch 60% in 2 weeks (FACT-014)
        assert any("60%" in s.matched_text for s in res.all_risk_spans)
        # Must catch ₹499 pricing (FACT-006)
        assert any("499" in s.matched_text for s in res.all_risk_spans)

    # Test Case 14: Custom text without optional key phrases or CTA
    def test_case_14_no_hallucinated_phrases_or_cta(self, pipeline, bkg):
        text = "Our sustainable packaging uses 100% recycled glass for all skincare bottles."
        req = VerificationRequest(brand_id="aurelle-tech", content=text, key_phrases="", call_to_action="")
        res = pipeline.verify_asset(req, bkg)

        # Must NOT inject missing key phrases like Diwali or missing CTA
        for span in res.all_risk_spans:
            assert "Missing required key phrase" not in span.explanation
            assert "Missing required call to action" not in span.explanation

    # Test Case 15: Content intelligence engine classification precision
    def test_case_15_classification_precision(self):
        tests = [
            ("Good morning, how are you today?", "Casual Greeting"),
            ("Happy anniversary to the team!", "Personal / Celebratory Message"),
            ("We are pleased to announce our series B round.", "Product / Corporate Announcement"),
            ("Office hours are 9 AM to 6 PM Monday to Friday.", "Informational / Operational"),
            ("Get 30% discount on all orders today only.", "Promotional / Commercial Offer"),
        ]
        for sentence, expected_type in tests:
            report = content_intelligence_engine.analyze(sentence)
            assert report.classification.content_type == expected_type
