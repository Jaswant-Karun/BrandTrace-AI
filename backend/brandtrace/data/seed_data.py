from typing import Dict
from brandtrace.graph.schema import (
    BrandGraphData, Node, Edge, NodeType, EdgeType, ApprovedFact
)

APEX_DYNAMICS_DATA = BrandGraphData(
    brand_id="apex-dynamics",
    brand_name="Apex Dynamics",
    industry="Clean Electric Mobility & Autonomous Systems",
    description="Tier-1 EV automaker renowned for ultra-high-efficiency powertrains, aerodynamic carbon construction, and strict safety engineering.",
    nodes=[
        # Brand
        Node(
            id="BRD-APEX",
            label="Apex Dynamics Global",
            type=NodeType.BRAND,
            description="Parent enterprise brand entity",
            properties={"headquarters": "Munich / San Jose", "established": "2021", "governance_tier": "Enterprise Tier-1"}
        ),
        # Pillars
        Node(
            id="PIL-01",
            label="QuantumCell™ Battery Architecture",
            type=NodeType.PILLAR,
            description="Proprietary 800V silicon-anode battery pack delivering maximum energy density and ultra-fast charging.",
            properties={"weight": 1.0, "category": "Powertrain"}
        ),
        Node(
            id="PIL-02",
            label="AeroPrecision Carbon Design",
            type=NodeType.PILLAR,
            description="Formula-1 derived active aerodynamics with lowest-in-class drag coefficients.",
            properties={"weight": 0.9, "category": "Aero Engineering"}
        ),
        Node(
            id="PIL-03",
            label="Radical Climate Transparency",
            type=NodeType.PILLAR,
            description="Empirical cradle-to-grave lifecycle emissions disclosure without deceptive carbon offsets.",
            properties={"weight": 0.95, "category": "ESG"}
        ),
        # Approved Facts (Product Prices, Specifications, Official Disclaimers)
        Node(
            id="FACT-PRC-01",
            label="QuantumConnect Fleet Subscription Price",
            type=NodeType.APPROVED_FACT,
            description="Official entry price point for connected vehicle telematics and remote diagnostics subscription.",
            properties={
                "category": "PRICE",
                "current_value": "₹499",
                "unit": "per vehicle / month",
                "department_owner": "Pricing & Commercial Operations",
                "verification_source": "Apex Executive Pricing Committee Resolution #2026-Q1-PRC",
                "status": "APPROVED_ACTIVE"
            }
        ),
        Node(
            id="FACT-SPEC-01",
            label="Apex Supercharger Peak Output",
            type=NodeType.APPROVED_FACT,
            description="Maximum DC fast charging output across proprietary charging network.",
            properties={
                "category": "SPECIFICATION",
                "current_value": "350kW",
                "unit": "kW DC",
                "department_owner": "Powertrain Engineering",
                "verification_source": "Apex Charging Infrastructure Specification v4.2"
            }
        ),
        # Tone Attributes
        Node(
            id="TONE-01",
            label="Precision Engineering",
            type=NodeType.TONE_ATTRIBUTE,
            description="Quantitative, restrained, factual, disciplined voice. Avoid ungrounded marketing fluff.",
            properties={"sentiment_floor": 0.4, "sentiment_ceiling": 0.85, "formality": "High"}
        ),
        Node(
            id="TONE-02",
            label="Visionary Sophistication",
            type=NodeType.TONE_ATTRIBUTE,
            description="Elevated, inspiring, confident tone that commands authority without arrogance.",
            properties={"formality": "Elevated", "banned_words": ["cheap", "unbeatable", "miracle", "insane"]}
        ),
        Node(
            id="TONE-03",
            label="Uncompromising Safety",
            type=NodeType.TONE_ATTRIBUTE,
            description="Strict adherence to driver responsibility, physical testing limits, and ISO 26262 functional safety.",
            properties={"mandatory_disclaimer": "Driver supervision required at all times."}
        ),
        # Trademarks
        Node(
            id="TM-01",
            label="QuantumCell™",
            type=NodeType.TRADEMARK,
            description="Registered trademark for proprietary cell chemistry. Must retain exact capitalization and ™ mark.",
            properties={"exact_mark": "QuantumCell™", "registered_territories": ["US", "EU", "JP", "UK", "IN"]}
        ),
        Node(
            id="TM-02",
            label="HyperDrive OS®",
            type=NodeType.TRADEMARK,
            description="Registered mark for vehicle central compute platform.",
            properties={"exact_mark": "HyperDrive OS®"}
        ),
        # Approved Claims
        Node(
            id="AC-01",
            label="520 miles EPA-estimated range",
            type=NodeType.APPROVED_CLAIM,
            description="Up to 520 miles EPA-estimated range with QuantumCell Architecture on single charge.",
            properties={
                "citation": "EPA Test Cycle J1634_202409, Certificate #EV-APX-982",
                "verified_date": "2025-10-14",
                "verification_status": "VALID"
            }
        ),
        Node(
            id="AC-02",
            label="10% to 80% charge in 14 minutes",
            type=NodeType.APPROVED_CLAIM,
            description="Charges from 10% to 80% state-of-charge in 14 minutes utilizing a 350kW DC ultra-fast charger.",
            properties={
                "citation": "Apex Internal Lab Validation Protocol AP-LAB-884-C",
                "verified_date": "2025-11-02",
                "verification_status": "VALID"
            }
        ),
        # Prohibited Claims
        Node(
            id="PC-01",
            label="Zero-Carbon / 100% Eco-Friendly without qualification",
            type=NodeType.PROHIBITED_CLAIM,
            description="Blanket claims of 'Zero-Carbon' or '100% Eco-Friendly' violate FTC Green Guides §260.4 and EU Green Claims Directive COM/2023/166.",
            properties={
                "severity": "CRITICAL",
                "governing_policy": "FTC Green Guides §260.4 / EU Directive 2024/825",
                "forbidden_phrases": ["100% eco-friendly", "zero carbon footprint", "completely green"]
            }
        ),
        Node(
            id="PC-02",
            label="Full Autonomous / Self-Driving without driver attention",
            type=NodeType.PROHIBITED_CLAIM,
            description="Claiming hands-free autonomous operation without requiring continuous driver vigilance triggers regulatory sanctions.",
            properties={"severity": "CRITICAL", "governing_policy": "NHTSA Standing General Order 2021-01"}
        ),
        # Regulations
        Node(
            id="REG-01",
            label="FTC Green Guides 16 CFR §260",
            type=NodeType.REGULATION,
            description="Standards governing environmental marketing claims, carbon offsets, and recyclability.",
            properties={"jurisdiction": "United States (Federal)"}
        ),
        # Campaigns
        Node(
            id="CMP-FLEET-01",
            label="Connected Fleet 2026 Initiative",
            type=NodeType.CAMPAIGN,
            description="Enterprise B2B and consumer push for remote fleet intelligence subscriptions.",
            properties={"quarter": "Q1 2026", "department": "Commercial Growth", "status": "LIVE"}
        ),
        Node(
            id="CMP-01",
            label="Spring 2026 Fleet Launch: The Precision Era",
            type=NodeType.CAMPAIGN,
            description="Global multi-channel flagship launch of the Apex GT Aerosedan.",
            properties={"quarter": "Q1 2026", "department": "Brand Marketing", "status": "LIVE"}
        ),
        # Advertisements (Directly dependent on FACT-PRC-01)
        Node(
            id="AD-META-01",
            label="Meta Carousel Ad: Fleet Connect at ₹499/mo",
            type=NodeType.ADVERTISEMENT,
            description="Digital sponsored carousel targeting commercial fleet operators with ₹499 entry subscription.",
            properties={
                "channel": "Instagram / Facebook Ads",
                "department": "Performance Marketing",
                "reviewer_role": "Performance Marketing Lead",
                "status": "APPROVED",
                "content": "Scale your EV logistics with real-time battery analytics. QuantumConnect starting at just ₹499/month per vehicle."
            }
        ),
        Node(
            id="AD-GOOG-01",
            label="Google PPC Ad: Smart Telematics from ₹499",
            type=NodeType.ADVERTISEMENT,
            description="Paid search ad highlighting affordable fleet telemetry starting at ₹499.",
            properties={
                "channel": "Google Search Ads",
                "department": "Performance Marketing",
                "reviewer_role": "Digital Growth Lead",
                "status": "APPROVED",
                "content": "Official Apex Telematics | Real-Time Fleet Diagnostics from ₹499/mo. 14-Day Free Enterprise Trial."
            }
        ),
        # Website (Directly dependent on FACT-PRC-01)
        Node(
            id="WEB-PRC-01",
            label="Apex Pricing Matrix & Checkout Page",
            type=NodeType.WEBSITE,
            description="Main consumer and enterprise checkout page showing pricing tiers.",
            properties={
                "channel": "Official Website (apex.auto/pricing)",
                "department": "E-Commerce & Digital Products",
                "reviewer_role": "E-Commerce Product Director",
                "status": "APPROVED",
                "content": "Standard Fleet Tier: ₹499 per vehicle billed monthly. Includes full QuantumCell™ telemetry and OTA updates."
            }
        ),
        # Document (Directly dependent on FACT-PRC-01)
        Node(
            id="DOC-PRO-01",
            label="B2B Commercial Sales PDF Deck",
            type=NodeType.DOCUMENT,
            description="Official enterprise procurement brochure distributed to fleet buyers.",
            properties={
                "channel": "PDF Document / Sales Collateral",
                "department": "Commercial B2B Sales",
                "reviewer_role": "Sales Operations Director",
                "status": "APPROVED",
                "content": "Commercial Specification Document: Enterprise telematics package is fixed at ₹499/unit monthly with annual contract."
            }
        ),
        # Other Assets
        Node(
            id="AST-01",
            label="Billboard: 520 Miles of Zero Compromise",
            type=NodeType.ASSET,
            description="Flagship OOH billboard featuring range and QuantumCell architecture.",
            properties={
                "channel": "OOH Billboard",
                "department": "Brand Marketing",
                "reviewer_role": "Brand Creative Director",
                "status": "APPROVED",
                "content": "520 Miles of Zero Compromise. Powered by QuantumCell™ 800V Architecture. The Apex GT arrives."
            }
        )
    ],
    edges=[
        # Brand -> Facts & Pillars
        Edge(source="BRD-APEX", target="PIL-01", type=EdgeType.DEFINES),
        Edge(source="BRD-APEX", target="PIL-02", type=EdgeType.DEFINES),
        Edge(source="BRD-APEX", target="PIL-03", type=EdgeType.DEFINES),
        Edge(source="BRD-APEX", target="FACT-PRC-01", type=EdgeType.DEFINES, label="approved_pricing"),
        Edge(source="BRD-APEX", target="FACT-SPEC-01", type=EdgeType.DEFINES, label="approved_spec"),
        Edge(source="BRD-APEX", target="TM-01", type=EdgeType.PROTECTS),

        # Campaigns
        Edge(source="BRD-APEX", target="CMP-FLEET-01", type=EdgeType.GOVERNS),
        Edge(source="BRD-APEX", target="CMP-01", type=EdgeType.GOVERNS),

        # Campaign -> Assets/Ads/Websites/Docs
        Edge(source="CMP-FLEET-01", target="AD-META-01", type=EdgeType.GOVERNS),
        Edge(source="CMP-FLEET-01", target="AD-GOOG-01", type=EdgeType.GOVERNS),
        Edge(source="CMP-FLEET-01", target="WEB-PRC-01", type=EdgeType.GOVERNS),
        Edge(source="CMP-FLEET-01", target="DOC-PRO-01", type=EdgeType.GOVERNS),
        Edge(source="CMP-01", target="AST-01", type=EdgeType.GOVERNS),

        # Assets -> DEPENDS_ON_FACT (The Core BDIG Links!)
        Edge(source="AD-META-01", target="FACT-PRC-01", type=EdgeType.DEPENDS_ON_FACT, label="cites_price_₹499"),
        Edge(source="AD-GOOG-01", target="FACT-PRC-01", type=EdgeType.DEPENDS_ON_FACT, label="cites_price_₹499"),
        Edge(source="WEB-PRC-01", target="FACT-PRC-01", type=EdgeType.DEPENDS_ON_FACT, label="publishes_price_₹499"),
        Edge(source="DOC-PRO-01", target="FACT-PRC-01", type=EdgeType.DEPENDS_ON_FACT, label="commits_price_₹499"),

        # Other claim dependencies
        Edge(source="AST-01", target="AC-01", type=EdgeType.CONTAINS_CLAIM),
        Edge(source="AST-01", target="TM-01", type=EdgeType.DEPENDS_ON),
    ]
)

NOVUS_HEALTH_DATA = BrandGraphData(
    brand_id="novus-health",
    brand_name="Novus Health Solutions",
    industry="Biopharmaceutical & Preventative Longevity",
    description="Precision cardiovascular therapeutics enterprise operating under strict FDA, FTC, and EMA regulatory compliance.",
    nodes=[
        Node(
            id="BRD-NOVUS",
            label="Novus Health Solutions",
            type=NodeType.BRAND,
            description="Parent biopharmaceutical enterprise brand",
            properties={"headquarters": "Boston / Basel", "governance_tier": "Biopharma FDA Class III"}
        ),
        Node(
            id="FACT-NH-PRC-01",
            label="NovusCare Patient Monitoring Subscription",
            type=NodeType.APPROVED_FACT,
            description="Patient support program monthly co-pay assistance and digital tracking membership.",
            properties={
                "category": "PRICE",
                "current_value": "₹499",
                "unit": "per patient / month",
                "department_owner": "Market Access & Patient Commercial",
                "verification_source": "Novus Commercial Access Policy 2026-B"
            }
        ),
        Node(
            id="PIL-NH-01",
            label="Clinical Evidence-First Rigor",
            type=NodeType.PILLAR,
            description="Every health claim must be anchored to published, peer-reviewed clinical trial evidence.",
            properties={"weight": 1.0}
        ),
        Node(
            id="TM-NH-01",
            label="CardioShield™",
            type=NodeType.TRADEMARK,
            description="Prescription oral small-molecule PCSK9 inhibitor brand name. Must include ™ mark.",
            properties={"exact_mark": "CardioShield™"}
        ),
        Node(
            id="CMP-NH-01",
            label="Patient Access & Lipid Horizon Campaign",
            type=NodeType.CAMPAIGN,
            description="Direct patient education and enrollment campaign.",
            properties={"quarter": "Q1 2026", "status": "LIVE"}
        ),
        Node(
            id="AD-NH-01",
            label="Digital Patient Ad: NovusCare Enrollment at ₹499",
            type=NodeType.ADVERTISEMENT,
            description="Digital banner for patient monitoring enrollment at ₹499 monthly.",
            properties={
                "channel": "Health Web Banner",
                "department": "Patient Advocacy & Marketing",
                "reviewer_role": "Patient Marketing Director",
                "status": "APPROVED",
                "content": "Support your cardiovascular therapy with NovusCare™ Digital Monitoring for only ₹499/month."
            }
        ),
        Node(
            id="WEB-NH-01",
            label="NovusCare Patient Portal Enrollment Page",
            type=NodeType.WEBSITE,
            description="Official enrollment page detailing ₹499 monthly subscription.",
            properties={
                "channel": "Patient Web Portal",
                "department": "Digital Patient Operations",
                "reviewer_role": "Clinical Operations Lead",
                "status": "APPROVED",
                "content": "NovusCare Membership: Comprehensive digital biomarker tracking for ₹499 per month."
            }
        )
    ],
    edges=[
        Edge(source="BRD-NOVUS", target="FACT-NH-PRC-01", type=EdgeType.DEFINES),
        Edge(source="BRD-NOVUS", target="PIL-NH-01", type=EdgeType.DEFINES),
        Edge(source="BRD-NOVUS", target="TM-NH-01", type=EdgeType.PROTECTS),
        Edge(source="BRD-NOVUS", target="CMP-NH-01", type=EdgeType.GOVERNS),
        Edge(source="CMP-NH-01", target="AD-NH-01", type=EdgeType.GOVERNS),
        Edge(source="CMP-NH-01", target="WEB-NH-01", type=EdgeType.GOVERNS),
        Edge(source="AD-NH-01", target="FACT-NH-PRC-01", type=EdgeType.DEPENDS_ON_FACT, label="cites_price_₹499"),
        Edge(source="WEB-NH-01", target="FACT-NH-PRC-01", type=EdgeType.DEPENDS_ON_FACT, label="publishes_price_₹499"),
    ]
)

BRAND_SEEDS: Dict[str, BrandGraphData] = {
    "apex-dynamics": APEX_DYNAMICS_DATA,
    "novus-health": NOVUS_HEALTH_DATA,
}

# Approved Facts Catalog for easy query
APPROVED_FACTS_CATALOG: Dict[str, ApprovedFact] = {
    "FACT-PRC-01": ApprovedFact(
        id="FACT-PRC-01",
        brand_id="apex-dynamics",
        name="QuantumConnect Fleet Subscription Price",
        category="PRICE",
        current_value="₹499",
        unit="per vehicle / month",
        description="Official entry price point for connected vehicle telematics subscription.",
        source_citation="Executive Pricing Committee Resolution #2026-Q1-PRC",
        department_owner="Pricing & Commercial Operations",
        last_verified="2026-01-15"
    ),
    "FACT-SPEC-01": ApprovedFact(
        id="FACT-SPEC-01",
        brand_id="apex-dynamics",
        name="Apex Supercharger Peak Output",
        category="SPECIFICATION",
        current_value="350kW",
        unit="kW DC",
        description="Maximum DC fast charging output across proprietary charging network.",
        source_citation="Apex Charging Infrastructure Specification v4.2",
        department_owner="Powertrain Engineering",
        last_verified="2026-02-01"
    ),
    "FACT-NH-PRC-01": ApprovedFact(
        id="FACT-NH-PRC-01",
        brand_id="novus-health",
        name="NovusCare Patient Monitoring Subscription",
        category="PRICE",
        current_value="₹499",
        unit="per patient / month",
        description="Patient support program monthly co-pay assistance and digital tracking membership.",
        source_citation="Novus Commercial Access Policy 2026-B",
        department_owner="Market Access & Patient Commercial",
        last_verified="2026-01-20"
    )
}
