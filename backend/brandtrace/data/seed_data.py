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
        ),
        Node(
            id="AST-04",
            label="PR Wire: The Completely Eco-Friendly Super-Saloon",
            type=NodeType.ASSET,
            description="Draft press release: 'Apex Dynamics launches 100% eco-friendly zero-emissions super-saloon.'",
            properties={
                "channel": "PR Newswire",
                "department": "Public Relations",
                "reviewer_role": "PR Communications Lead",
                "status": "FLAGGED_FOR_REMEDIATION",
                "content": "Apex Dynamics unveils the world's most completely eco-friendly vehicle with zero carbon footprint and 85% post-consumer recycled aluminum."
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
        Edge(source="AST-04", target="PC-01", type=EdgeType.DEPENDS_ON, label="violates_greenwashing"),
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

AURELLE_TECH_DATA = BrandGraphData(
    brand_id="aurelle-tech",
    brand_name="Aurelle Technologies Inc.",
    industry="Premium Consumer Electronics & Ambient Spatial Computing",
    description="Silicon Valley & Zurich enterprise crafting aerospace-titanium smart wearables, studio-grade lossless acoustics, and ambient cloud intelligence.",
    nodes=[
        # Brand Root
        Node(
            id="BRD-AURELLE",
            label="Aurelle Technologies Global",
            type=NodeType.BRAND,
            description="Parent premium consumer technology enterprise entity",
            properties={
                "headquarters": "San Francisco / Zurich",
                "established": "2022",
                "governance_tier": "Enterprise Tier-1 Hardware & Cloud",
                "legal_entity": "Aurelle Technologies Inc."
            }
        ),
        # Pillars
        Node(
            id="PIL-AUR-01",
            label="QuantumPower™ Silicon Architecture",
            type=NodeType.PILLAR,
            description="Custom 3nm ultra-low-leakage silicon micro-architecture enabling 72-hour continuous wearable computing.",
            properties={"category": "Silicon Hardware", "weight": 1.0}
        ),
        Node(
            id="PIL-AUR-02",
            label="Lossless Studio Acoustics",
            type=NodeType.PILLAR,
            description="Proprietary 24-bit 192kHz spatial audio rendering with active room-boundary impulse modeling.",
            properties={"category": "Audio Engineering", "weight": 0.95}
        ),
        Node(
            id="PIL-AUR-03",
            label="Privacy & Wellness Integrity",
            type=NodeType.PILLAR,
            description="On-device cryptographic biometric enclave with zero cloud telemetry without explicit user consent.",
            properties={"category": "Privacy & Security", "weight": 1.0}
        ),
        # Products
        Node(
            id="PRD-AUR-01",
            label="Aurelle Horizon Watch Ultra",
            type=NodeType.PRODUCT,
            description="Flagship wearable in Grade 5 Aerospace Titanium with 72-hour battery life and sapphire crystal display.",
            properties={"category": "Wearables", "msrp": "₹49,999", "material": "Grade 5 Aerospace Titanium", "battery": "72 hours"}
        ),
        Node(
            id="PRD-AUR-02",
            label="Aurelle Aura Pro Earbuds",
            type=NodeType.PRODUCT,
            description="Lossless studio earbuds featuring QuantumAcoustics™ 24-bit 192kHz spatial reproduction and 45ms latency.",
            properties={"category": "Audio", "msrp": "₹19,999", "codec": "QuantumAcoustics™", "latency": "45ms"}
        ),
        Node(
            id="PRD-AUR-03",
            label="Aurelle Pulse Smart Ring",
            type=NodeType.PRODUCT,
            description="Titanium consumer biometric wellness monitor. Certified non-diagnostic under FDA 21 CFR §870.",
            properties={"category": "Wellness", "msrp": "₹14,999", "compliance": "Non-diagnostic general wellness"}
        ),
        Node(
            id="PRD-AUR-04",
            label="Aurelle Cloud Studio Subscription",
            type=NodeType.PRODUCT,
            description="Creative audio mastering and spatial intelligence SaaS platform for studio creators and enterprises.",
            properties={"category": "SaaS Platform", "active_price": "₹499/mo", "tier": "Creator Pro"}
        ),
        # Approved Facts
        Node(
            id="FACT-AUR-PRC-01",
            label="Aurelle Cloud Studio Subscription Price",
            type=NodeType.APPROVED_FACT,
            description="Official entry price point for Aurelle Cloud Studio audio and spatial mastering suite.",
            properties={
                "category": "PRICE",
                "current_value": "₹499",
                "unit": "per creator / month",
                "department_owner": "Pricing & Commercial Operations",
                "verification_source": "Aurelle Commercial Committee Resolution #2026-Q1-AUR",
                "status": "APPROVED_ACTIVE"
            }
        ),
        Node(
            id="FACT-AUR-BAT-01",
            label="Horizon Watch Continuous Battery Life",
            type=NodeType.APPROVED_FACT,
            description="Standardized continuous runtime under IEC 62133 certified laboratory testing.",
            properties={
                "category": "SPECIFICATION",
                "current_value": "72 hours",
                "unit": "continuous runtime",
                "department_owner": "Hardware Engineering",
                "verification_source": "IEC 62133 Standard Lab Protocol #AUR-LAB-BAT-72H",
                "mandatory_disclosure": "Tested under IEC 62133 standardized lab protocol. Actual results vary by usage."
            }
        ),
        Node(
            id="FACT-AUR-AUD-01",
            label="QuantumAcoustics™ Audio Resolution",
            type=NodeType.APPROVED_FACT,
            description="Mastering-grade lossless digital acoustic pipeline certified for studio audio reproduction.",
            properties={
                "category": "SPECIFICATION",
                "current_value": "24-bit 192kHz",
                "unit": "lossless spatial audio",
                "department_owner": "Acoustics Engineering",
                "verification_source": "Acoustics Certification Dossier #AUR-AC-994"
            }
        ),
        Node(
            id="FACT-AUR-TIT-01",
            label="Horizon Watch Metallurgy Specification",
            type=NodeType.APPROVED_FACT,
            description="ASTM B265 Grade 5 Aerospace Titanium milled enclosure with PVD diamond-like carbon finish.",
            properties={
                "category": "SPECIFICATION",
                "current_value": "Grade 5 Aerospace Titanium",
                "unit": "metallurgy grade",
                "department_owner": "Industrial Design",
                "verification_source": "ASTM B265 Grade 5 Titanium Certification #TIT-2026-08"
            }
        ),
        Node(
            id="FACT-AUR-EXP-01",
            label="Free 2025 Cloud Studio Founder Trial",
            type=NodeType.APPROVED_FACT,
            description="Introductory trial tier that officially expired on December 31, 2025.",
            properties={
                "category": "PROMOTION",
                "current_value": "₹0 for 6 months",
                "unit": "promotional tier",
                "status": "EXPIRED",
                "expired_date": "2025-12-31",
                "department_owner": "Growth Marketing",
                "verification_source": "Aurelle Founder Growth Promotion #2025-FNDR"
            }
        ),
        # Brand Guidelines
        Node(
            id="GL-AUR-01",
            label="Logo Safe Zone Clearance Mandate",
            type=NodeType.GUIDELINE,
            description="All marketing collateral and visual layouts must maintain a minimum 20px clear margin around the Aurelle wordmark.",
            properties={"category": "VISUAL_IDENTITY", "min_clearance_px": 20, "severity": "HIGH"}
        ),
        Node(
            id="GL-AUR-02",
            label="Approved Master Color Palette",
            type=NodeType.GUIDELINE,
            description="Approved brand colors: Obsidian Black (#0A0E1A), Titanium Grey (#8A95A5), Champagne Gold (#D4AF37). Neon hues (#FF5500) strictly banned.",
            properties={"category": "VISUAL_IDENTITY", "primary_hex": "#0A0E1A", "accent_hex": "#D4AF37", "forbidden": ["#FF5500", "Neon Orange"]}
        ),
        Node(
            id="GL-AUR-03",
            label="FDA 21 CFR §870 Non-Diagnostic Wellness Rule",
            type=NodeType.REGULATION,
            description="Pulse Smart Ring is a consumer general wellness monitor. Describing it as a medical-grade diagnostic cure or treating heart disease triggers federal action.",
            properties={"category": "REGULATORY_COMPLIANCE", "jurisdiction": "FDA / FTC", "severity": "CRITICAL"}
        ),
        Node(
            id="GL-AUR-04",
            label="Battery Life Statutory Testing Disclosure",
            type=NodeType.GUIDELINE,
            description="Any claim stating 72-hour battery life must append the mandatory footnote: 'Tested under IEC 62133 standardized lab protocol. Actual results vary.'",
            properties={"category": "LEGAL_DISCLOSURE", "severity": "HIGH"}
        ),
        Node(
            id="GL-AUR-05",
            label="QuantumAcoustics™ Trademark Policy",
            type=NodeType.TRADEMARK,
            description="QuantumAcoustics™ must always include the ™ trademark symbol. Product name is Aurelle Horizon, never Aurelle Horizun.",
            properties={"category": "INTELLECTUAL_PROPERTY", "exact_mark": "QuantumAcoustics™"}
        ),
        Node(
            id="GL-AUR-06",
            label="Global Master Typography Directive",
            type=NodeType.GUIDELINE,
            description="Headlines must utilize Editorial Serif typography; body copy and UI must utilize Inter Enterprise. Regional conflicting font rules yield to Master Rule.",
            properties={"category": "TYPOGRAPHY", "severity": "MODERATE"}
        ),
        Node(
            id="GL-AUR-07",
            label="WCAG 2.1 AA Accessibility Mandate",
            type=NodeType.REGULATION,
            description="All digital consumer touchpoints must maintain minimum 4.5:1 text-to-background contrast and provide descriptive alt-text.",
            properties={"category": "ACCESSIBILITY", "min_contrast_ratio": 4.5, "severity": "HIGH"}
        ),
        # Trademarks
        Node(
            id="TM-AUR-01",
            label="QuantumAcoustics™",
            type=NodeType.TRADEMARK,
            description="Registered trademark for proprietary spatial audio mastering codec.",
            properties={"exact_mark": "QuantumAcoustics™", "uspto_reg": "USPTO #7,112,890"}
        ),
        Node(
            id="TM-AUR-02",
            label="Aurelle Horizon™",
            type=NodeType.TRADEMARK,
            description="Registered trademark for aerospace titanium wearable series.",
            properties={"exact_mark": "Aurelle Horizon™", "uspto_reg": "USPTO #7,112,891"}
        ),
        Node(
            id="TM-AUR-03",
            label="QuantumPower™",
            type=NodeType.TRADEMARK,
            description="Registered trademark for 3nm low-leakage wearable compute silicon.",
            properties={"exact_mark": "QuantumPower™", "uspto_reg": "USPTO #7,112,892"}
        ),
        # Campaigns
        Node(
            id="CMP-AUR-01",
            label="Horizon 2026: Time Redefined",
            type=NodeType.CAMPAIGN,
            description="Global multi-channel product introduction for Aurelle Horizon Watch Ultra.",
            properties={"quarter": "Q1 2026", "department": "Hardware Product Marketing", "status": "LIVE"}
        ),
        Node(
            id="CMP-AUR-02",
            label="Cloud Studio Scale-Up 2026",
            type=NodeType.CAMPAIGN,
            description="Global subscription growth campaign for Aurelle Cloud Studio audio and spatial mastering suite.",
            properties={"quarter": "Q1 2026", "department": "Cloud Growth & Subscriptions", "status": "LIVE"}
        ),
        # Connected Content Assets (Directly dependent on FACT-AUR-PRC-01 at ₹499)
        Node(
            id="AST-AUR-AD-02",
            label="Meta Feed Ad: Cloud Studio at ₹499/mo",
            type=NodeType.ADVERTISEMENT,
            description="Sponsored social feed ad targeting creative professionals with ₹499 monthly subscription.",
            properties={
                "channel": "Instagram / Meta Feed Ads",
                "department": "Performance Marketing",
                "reviewer_role": "Performance Marketing Lead",
                "status": "APPROVED",
                "content": "Scale your creative workflows with Aurelle Cloud Studio. Spatial audio mastering starting at just ₹499/month."
            }
        ),
        Node(
            id="AST-AUR-AD-03",
            label="Google PPC Ad: Cloud Studio from ₹499",
            type=NodeType.ADVERTISEMENT,
            description="Paid search ad highlighting affordable studio spatial intelligence starting at ₹499.",
            properties={
                "channel": "Google Search Ads",
                "department": "Performance Marketing",
                "reviewer_role": "Digital Growth Lead",
                "status": "APPROVED",
                "content": "Official Aurelle Cloud Studio | AI-Powered Spatial Audio Mastering from ₹499/mo. 14-Day Enterprise Trial."
            }
        ),
        Node(
            id="AST-AUR-WEB-01",
            label="Aurelle Cloud Studio Pricing & Checkout Page",
            type=NodeType.WEBSITE,
            description="Primary checkout and pricing matrix page displaying creator and studio tiers.",
            properties={
                "channel": "Official Website (aurelle.com/pricing)",
                "department": "E-Commerce & Digital Products",
                "reviewer_role": "E-Commerce Product Director",
                "status": "APPROVED",
                "content": "Creator Pro Tier: ₹499 per creator billed monthly. Includes full QuantumAcoustics™ spatial mastering and unlimited cloud storage."
            }
        ),
        Node(
            id="AST-AUR-DOC-01",
            label="B2B Enterprise Rate Card & Licensing PDF",
            type=NodeType.DOCUMENT,
            description="Official sales brochure and procurement document distributed to enterprise media buyers.",
            properties={
                "channel": "PDF Document / Sales Collateral",
                "department": "Commercial B2B Sales",
                "reviewer_role": "Sales Operations Director",
                "status": "APPROVED",
                "content": "Commercial Specification Document: Enterprise studio seat licensing is fixed at ₹499/seat monthly under annual agreement."
            }
        ),
        Node(
            id="AST-AUR-AD-01",
            label="OOH Billboard: 72h Continuous Battery",
            type=NodeType.ASSET,
            description="Flagship launch billboard highlighting 72h battery and Grade 5 titanium.",
            properties={
                "channel": "OOH Billboard",
                "department": "Brand Creative",
                "reviewer_role": "Creative Director",
                "status": "APPROVED",
                "content": "72h Continuous Battery. Grade 5 Aerospace Titanium. Aurelle Horizon Watch Ultra arrives."
            }
        ),
        # 9 Governance Demonstration Test Cases
        Node(
            id="AST-CASE-01",
            label="Case 1: Unsupported Claim (100% Unbreakable)",
            type=NodeType.ASSET,
            description="Promotional social post claiming 100% unbreakable watch without scientific substantiation.",
            properties={
                "channel": "Social Media",
                "department": "Growth Marketing",
                "status": "FLAGGED_FOR_REMEDIATION",
                "content": "Aurelle Horizon Watch Ultra is 100% unbreakable and completely indestructible in all extreme physical environments."
            }
        ),
        Node(
            id="AST-CASE-02",
            label="Case 2: Expired Approved Fact (2025 Founder Promo)",
            type=NodeType.ASSET,
            description="Promotional email copy referencing the expired ₹0 2025 founder trial tier.",
            properties={
                "channel": "Email Marketing",
                "department": "Retention Marketing",
                "status": "FLAGGED_FOR_REMEDIATION",
                "content": "Claim your Aurelle Cloud Studio subscription for ₹0 free for 6 months under the Founder Launch Trial."
            }
        ),
        Node(
            id="AST-CASE-03",
            label="Case 3: Naming Defect (Horizun & Missing TM)",
            type=NodeType.ASSET,
            description="Product announcement containing misspelling 'Horizun' and missing trademark symbol on QuantumAcoustics.",
            properties={
                "channel": "Digital Display",
                "department": "Performance Marketing",
                "status": "FLAGGED_FOR_REMEDIATION",
                "content": "Experience the revolutionary Aurelle Horizun Watch with QuantumAcoustics spatial sound streaming."
            }
        ),
        Node(
            id="AST-CASE-04",
            label="Case 4: Prohibited Terminology (Medical Diagnostic Cure)",
            type=NodeType.ASSET,
            description="Wellness ring ad asserting it cures cardiovascular disease, violating FDA 21 CFR §870.",
            properties={
                "channel": "Social Media Ads",
                "department": "Growth Marketing",
                "status": "FLAGGED_FOR_REMEDIATION",
                "content": "Aurelle Pulse Smart Ring is a medical-grade diagnostic cure that eliminates all symptoms of cardiovascular disease."
            }
        ),
        Node(
            id="AST-CASE-05",
            label="Case 5: Logo Inconsistency (12px Clearance < 20px)",
            type=NodeType.ASSET,
            description="Digital lockup violating minimum 20px safe-zone boundary around Aurelle wordmark.",
            properties={
                "channel": "Digital Banner",
                "department": "Creative Production",
                "status": "FLAGGED_FOR_REMEDIATION",
                "content": "Visual asset rendered with 12px padding clearance around Aurelle wordmark."
            }
        ),
        Node(
            id="AST-CASE-06",
            label="Case 6: Off-Palette Color (Neon Orange #FF5500)",
            type=NodeType.ASSET,
            description="Web banner utilizing unapproved neon orange background violating Obsidian/Champagne Gold palette.",
            properties={
                "channel": "Web Landing Page",
                "department": "Web Design",
                "status": "FLAGGED_FOR_REMEDIATION",
                "content": "Hero banner formatted with primary accent Neon Orange #FF5500 background."
            }
        ),
        Node(
            id="AST-CASE-07",
            label="Case 7: Missing Statutory Disclosure (IEC 62133)",
            type=NodeType.ASSET,
            description="Battery claim omitting mandatory IEC 62133 laboratory benchmark disclaimer.",
            properties={
                "channel": "Print Catalog",
                "department": "Product Marketing",
                "status": "FLAGGED_FOR_REMEDIATION",
                "content": "Enjoy 72-hour continuous battery life on single charge without interruptions."
            }
        ),
        Node(
            id="AST-CASE-08",
            label="Case 8: Accessibility Failure (Low Contrast 2.3:1 & Missing Alt)",
            type=NodeType.ASSET,
            description="Web banner with low-contrast #777777 text on #333333 failing WCAG 2.1 AA 4.5:1 ratio.",
            properties={
                "channel": "Website Hero",
                "department": "Digital Experience",
                "status": "FLAGGED_FOR_REMEDIATION",
                "content": "Promotional web banner with low-contrast #777777 body text on #333333 dark slate and missing alt-text."
            }
        ),
        Node(
            id="AST-CASE-09",
            label="Case 9: Conflicting Brand Guidelines (Helvetica vs Editorial Serif)",
            type=NodeType.ASSET,
            description="Regional collateral using Helvetica Neue in conflict with Global Master Rule GL-AUR-06.",
            properties={
                "channel": "European Press Pack",
                "department": "Regional EU Communications",
                "status": "FLAGGED_FOR_REMEDIATION",
                "content": "Press release authored in Helvetica Neue following regional EU guidelines in conflict with Global Master Rule GL-AUR-06."
            }
        )
    ],
    edges=[
        # Brand -> Pillars & Facts & Guidelines
        Edge(source="BRD-AURELLE", target="PIL-AUR-01", type=EdgeType.DEFINES),
        Edge(source="BRD-AURELLE", target="PIL-AUR-02", type=EdgeType.DEFINES),
        Edge(source="BRD-AURELLE", target="PIL-AUR-03", type=EdgeType.DEFINES),
        Edge(source="BRD-AURELLE", target="PRD-AUR-01", type=EdgeType.DEFINES),
        Edge(source="BRD-AURELLE", target="PRD-AUR-02", type=EdgeType.DEFINES),
        Edge(source="BRD-AURELLE", target="PRD-AUR-03", type=EdgeType.DEFINES),
        Edge(source="BRD-AURELLE", target="PRD-AUR-04", type=EdgeType.DEFINES),
        Edge(source="BRD-AURELLE", target="FACT-AUR-PRC-01", type=EdgeType.DEFINES, label="approved_pricing"),
        Edge(source="BRD-AURELLE", target="FACT-AUR-BAT-01", type=EdgeType.DEFINES, label="approved_spec"),
        Edge(source="BRD-AURELLE", target="FACT-AUR-AUD-01", type=EdgeType.DEFINES, label="approved_spec"),
        Edge(source="BRD-AURELLE", target="FACT-AUR-TIT-01", type=EdgeType.DEFINES, label="approved_spec"),
        Edge(source="BRD-AURELLE", target="FACT-AUR-EXP-01", type=EdgeType.DEFINES, label="expired_fact"),
        Edge(source="BRD-AURELLE", target="GL-AUR-01", type=EdgeType.GOVERNS),
        Edge(source="BRD-AURELLE", target="GL-AUR-02", type=EdgeType.GOVERNS),
        Edge(source="BRD-AURELLE", target="GL-AUR-03", type=EdgeType.GOVERNS),
        Edge(source="BRD-AURELLE", target="GL-AUR-04", type=EdgeType.GOVERNS),
        Edge(source="BRD-AURELLE", target="GL-AUR-05", type=EdgeType.PROTECTS),
        Edge(source="BRD-AURELLE", target="GL-AUR-06", type=EdgeType.GOVERNS),
        Edge(source="BRD-AURELLE", target="GL-AUR-07", type=EdgeType.GOVERNS),
        Edge(source="BRD-AURELLE", target="TM-AUR-01", type=EdgeType.PROTECTS),
        Edge(source="BRD-AURELLE", target="TM-AUR-02", type=EdgeType.PROTECTS),
        Edge(source="BRD-AURELLE", target="TM-AUR-03", type=EdgeType.PROTECTS),

        # Campaigns
        Edge(source="BRD-AURELLE", target="CMP-AUR-01", type=EdgeType.GOVERNS),
        Edge(source="BRD-AURELLE", target="CMP-AUR-02", type=EdgeType.GOVERNS),

        # Campaign -> Assets
        Edge(source="CMP-AUR-01", target="AST-AUR-AD-01", type=EdgeType.GOVERNS),
        Edge(source="CMP-AUR-02", target="AST-AUR-AD-02", type=EdgeType.GOVERNS),
        Edge(source="CMP-AUR-02", target="AST-AUR-AD-03", type=EdgeType.GOVERNS),
        Edge(source="CMP-AUR-02", target="WEB-AUR-01", type=EdgeType.GOVERNS),
        Edge(source="CMP-AUR-02", target="DOC-AUR-01", type=EdgeType.GOVERNS),

        # Core BDIG Dependencies (Assets Citing FACT-AUR-PRC-01 at ₹499)
        Edge(source="AST-AUR-AD-02", target="FACT-AUR-PRC-01", type=EdgeType.DEPENDS_ON_FACT, label="cites_price_₹499"),
        Edge(source="AST-AUR-AD-03", target="FACT-AUR-PRC-01", type=EdgeType.DEPENDS_ON_FACT, label="cites_price_₹499"),
        Edge(source="AST-AUR-WEB-01", target="FACT-AUR-PRC-01", type=EdgeType.DEPENDS_ON_FACT, label="publishes_price_₹499"),
        Edge(source="AST-AUR-DOC-01", target="FACT-AUR-PRC-01", type=EdgeType.DEPENDS_ON_FACT, label="commits_price_₹499"),

        # Other Dependencies
        Edge(source="AST-AUR-AD-01", target="FACT-AUR-BAT-01", type=EdgeType.DEPENDS_ON_FACT, label="cites_battery_72h"),
        Edge(source="AST-AUR-AD-01", target="FACT-AUR-TIT-01", type=EdgeType.DEPENDS_ON_FACT, label="cites_titanium"),
        Edge(source="AST-AUR-AD-01", target="TM-AUR-02", type=EdgeType.DEPENDS_ON),
        Edge(source="AST-AUR-WEB-01", target="TM-AUR-01", type=EdgeType.DEPENDS_ON),

        # Demo Test Cases Edge Connections
        Edge(source="AST-CASE-01", target="PIL-AUR-01", type=EdgeType.DEPENDS_ON, label="unsupported_claim"),
        Edge(source="AST-CASE-02", target="FACT-AUR-EXP-01", type=EdgeType.DEPENDS_ON_FACT, label="cites_expired_fact"),
        Edge(source="AST-CASE-03", target="TM-AUR-01", type=EdgeType.DEPENDS_ON, label="violates_trademark_policy"),
        Edge(source="AST-CASE-04", target="GL-AUR-03", type=EdgeType.DEPENDS_ON, label="violates_fda_wellness"),
        Edge(source="AST-CASE-05", target="GL-AUR-01", type=EdgeType.DEPENDS_ON, label="violates_logo_clearance"),
        Edge(source="AST-CASE-06", target="GL-AUR-02", type=EdgeType.DEPENDS_ON, label="violates_color_palette"),
        Edge(source="AST-CASE-07", target="GL-AUR-04", type=EdgeType.DEPENDS_ON, label="missing_statutory_disclosure"),
        Edge(source="AST-CASE-08", target="GL-AUR-07", type=EdgeType.DEPENDS_ON, label="violates_wcag_contrast"),
        Edge(source="AST-CASE-09", target="GL-AUR-06", type=EdgeType.DEPENDS_ON, label="conflicting_typography_directive")
    ]
)

BRAND_SEEDS: Dict[str, BrandGraphData] = {
    "apex-dynamics": APEX_DYNAMICS_DATA,
    "novus-health": NOVUS_HEALTH_DATA,
    "aurelle-tech": AURELLE_TECH_DATA,
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
    ),
    "FACT-AUR-PRC-01": ApprovedFact(
        id="FACT-AUR-PRC-01",
        brand_id="aurelle-tech",
        name="Aurelle Cloud Studio Subscription Price",
        category="PRICE",
        current_value="₹499",
        unit="per creator / month",
        description="Official entry subscription for Aurelle Cloud Studio audio and spatial mastering suite.",
        source_citation="Aurelle Commercial Committee Resolution #2026-Q1-AUR",
        department_owner="Pricing & Commercial Operations",
        last_verified="2026-01-15"
    ),
    "FACT-AUR-BAT-01": ApprovedFact(
        id="FACT-AUR-BAT-01",
        brand_id="aurelle-tech",
        name="Horizon Watch Continuous Battery Life",
        category="SPECIFICATION",
        current_value="72 hours",
        unit="continuous runtime",
        description="Official continuous battery runtime under IEC 62133 standardized lab protocol.",
        source_citation="IEC 62133 Standard Lab Protocol #AUR-LAB-BAT-72H",
        department_owner="Hardware Engineering",
        last_verified="2026-02-01"
    ),
    "FACT-AUR-AUD-01": ApprovedFact(
        id="FACT-AUR-AUD-01",
        brand_id="aurelle-tech",
        name="QuantumAcoustics™ Audio Resolution",
        category="SPECIFICATION",
        current_value="24-bit 192kHz",
        unit="lossless spatial audio",
        description="Mastering-grade lossless digital acoustic pipeline certified for studio reproduction.",
        source_citation="Acoustics Certification Dossier #AUR-AC-994",
        department_owner="Acoustics Engineering",
        last_verified="2026-01-28"
    ),
    "FACT-AUR-TIT-01": ApprovedFact(
        id="FACT-AUR-TIT-01",
        brand_id="aurelle-tech",
        name="Horizon Watch Metallurgy Specification",
        category="SPECIFICATION",
        current_value="Grade 5 Aerospace Titanium",
        unit="metallurgy grade",
        description="ASTM B265 Grade 5 Titanium enclosure engineered for extreme strength-to-weight ratio.",
        source_citation="ASTM B265 Grade 5 Titanium Certification #TIT-2026-08",
        department_owner="Industrial Design",
        last_verified="2026-01-10"
    ),
    "FACT-AUR-EXP-01": ApprovedFact(
        id="FACT-AUR-EXP-01",
        brand_id="aurelle-tech",
        name="Free 2025 Cloud Studio Founder Trial",
        category="PROMOTION",
        current_value="₹0 for 6 months",
        unit="promotional tier",
        description="Introductory trial tier that officially expired on December 31, 2025.",
        source_citation="Aurelle Founder Growth Promotion #2025-FNDR",
        department_owner="Growth Marketing",
        last_verified="2025-12-31"
    ),

    # -------------------------------------------------------------
    # AURELLE SKIN APPROVED FACTS CATALOG (FACT-001 through FACT-035)
    # Matching Plumbline live governance specifications
    # -------------------------------------------------------------
    "FACT-001": ApprovedFact(
        id="FACT-001",
        brand_id="aurelle-tech",
        name="Aurelle Barrier Defense Serum MSRP",
        category="PRICING",
        current_value="$48 / ₹3,999",
        unit="per 50ml unit",
        description="Official manufacturer suggested retail price for Aurelle Barrier Defense Serum across all verified commercial channels.",
        source_citation="Aurelle Executive Pricing Schedule #2026-Q1-AUR",
        department_owner="Pricing & Commercial Operations",
        last_verified="2026-02-01",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording="Aurelle Barrier Defense Serum retails at an official MSRP of $48 / ₹3,999.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-002": ApprovedFact(
        id="FACT-002",
        brand_id="aurelle-tech",
        name="Fragrance-Free Formulation Mandate",
        category="FORMULATION",
        current_value="100% Unscented",
        unit="formulation standard",
        description="Complete absence of synthetic fragrances, masking scents, and volatile essential oils to prevent barrier irritation.",
        source_citation="Aurelle Clean Formulation Charter §4.1",
        department_owner="R&D",
        last_verified="2026-01-15",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording="100% fragrance-free with zero essential oils or synthetic masking perfumes.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-003": ApprovedFact(
        id="FACT-003",
        brand_id="aurelle-tech",
        name="Non-Comedogenic Clinical Testing Clearance",
        category="SAFETY",
        current_value="Acne Grade 0",
        unit="clinical score",
        description="Clinically verified non-comedogenic formulation protocol confirming zero pore occlusion under dermatologist observation.",
        source_citation="BioClinical Protocol #NC-2025-110",
        department_owner="Safety & Toxicology",
        last_verified="2026-01-20",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording="Tested non-comedogenic, clinically proven not to clog pores.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-004": ApprovedFact(
        id="FACT-004",
        brand_id="aurelle-tech",
        name="pH-Optimized Barrier Protection Level",
        category="FORMULATION",
        current_value="pH 5.2 - 5.5",
        unit="acidity level",
        description="Formula calibrated to physiological stratum corneum pH, supporting acid mantle integrity and lipid enzymes.",
        source_citation="Aurelle Formulation Lab Dossier #PH-AUR-2025",
        department_owner="Formulation Science",
        last_verified="2026-02-05",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording="Formulated at skin's natural acidic pH of 5.2 to 5.5 to support optimal barrier enzyme function.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-005": ApprovedFact(
        id="FACT-005",
        brand_id="aurelle-tech",
        name="Barrier Defense Clinical Hydration Rate",
        category="CLINICAL",
        current_value="94% hydration increase",
        unit="corneometer",
        description="Double-blind, placebo-controlled study measuring stratum corneum capacitance improvement over 14 consecutive days.",
        source_citation="BioSkin Lab Clinical Cohort #BS-2025-94B",
        department_owner="Clinical Research",
        last_verified="2026-02-10",
        source_date="2025-07-01",
        expiry_date="2027-06-30",
        approved_wording="Clinically proven to increase epidermal hydration by 94% within 14 days of twice-daily use.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-006": ApprovedFact(
        id="FACT-006",
        brand_id="aurelle-tech",
        name="Cruelty-Free International Leaping Bunny Certification",
        category="CERTIFICATIONS",
        current_value="Annual Certified",
        unit="accreditation",
        description="Global cruelty-free certification verifying no animal testing at any stage of product development or supply chain.",
        source_citation="Cruelty Free International Audit Certificate #LB-2026-8812",
        department_owner="Compliance & Regulatory",
        last_verified="2026-01-05",
        source_date="2026-01-01",
        expiry_date="2026-12-31",
        approved_wording="Cruelty-free certified under the Leaping Bunny programme through 2026.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-007": ApprovedFact(
        id="FACT-007",
        brand_id="aurelle-tech",
        name="100% Vegan & Botanical Integrity Guarantee",
        category="ETHICS",
        current_value="100% Vegan",
        unit="composition",
        description="Formulated without animal-derived collagen, beeswax, lanolin, carmine, or animal squalene.",
        source_citation="The Vegan Society Verification #VS-2025-992",
        department_owner="Product Integrity",
        last_verified="2026-01-12",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording="100% vegan formulation certified free from any animal-derived ingredients.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-008": ApprovedFact(
        id="FACT-008",
        brand_id="aurelle-tech",
        name="Zero Harsh Preservatives Exclusion Standard",
        category="INGREDIENTS",
        current_value="0% Parabens / Sulfates",
        unit="exclusion standard",
        description="Guaranteed exclusion of parabens, phthalates, sulfates (SLS/SLES), mineral oil, and formaldehyde releasers.",
        source_citation="Aurelle Banned Substance Registry v3.2",
        department_owner="Regulatory Affairs",
        last_verified="2026-02-01",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording="Strictly formulated without parabens, sulfates, phthalates, mineral oil, or synthetic dyes.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-009": ApprovedFact(
        id="FACT-009",
        brand_id="aurelle-tech",
        name="Sustainably Harvested Squalane Purity",
        category="INGREDIENTS",
        current_value="100% plant-derived, 99.8% pure",
        unit="purity tier",
        description="Ethically cultivated Brazilian sugarcane fermented squalane providing non-greasy biocompatible lipid restoration.",
        source_citation="EcoCert Natural Origin Verification #ECO-SQ-2025-99",
        department_owner="Supply Chain & Sourcing",
        last_verified="2026-01-22",
        source_date="2025-07-01",
        expiry_date="2027-12-31",
        approved_wording="Contains 100% sugarcane-derived squalane certified for botanical purity and sustainability.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-010": ApprovedFact(
        id="FACT-010",
        brand_id="aurelle-tech",
        name="Transepidermal Water Loss (TEWL) Reduction",
        category="CLINICAL",
        current_value="42% reduction",
        unit="evaporimetry",
        description="Standardized Tewameter TM 300 test protocol proving a 42% decrease in moisture vapor escape after 28 days.",
        source_citation="Eurofins Skin Testing Protocol #EF-TEWL-2025-11",
        department_owner="Clinical Research",
        last_verified="2026-02-14",
        source_date="2025-10-01",
        expiry_date="2027-09-30",
        approved_wording="Reduces transepidermal water loss by 42% after continuous 28-day regimen.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-011": ApprovedFact(
        id="FACT-011",
        brand_id="aurelle-tech",
        name="Multi-Molecular Hyaluronic Acid Spectrum",
        category="INGREDIENTS",
        current_value="4 Molecular Weights",
        unit="molecular fractions",
        description="Features high, medium, low, and oligo-sodium hyaluronate fractions (5kDa - 1.8MDa) for multi-depth skin hydration.",
        source_citation="Polymer Analytical Report #HA-AUR-SPEC-2025",
        department_owner="Formulation Science",
        last_verified="2026-01-18",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording="Formulated with a four-tier hyaluronic acid complex targeting surface and deep dermal hydration.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-012": ApprovedFact(
        id="FACT-012",
        brand_id="aurelle-tech",
        name="Niacinamide Physiological Concentration",
        category="INGREDIENTS",
        current_value="5% Vitamin B3",
        unit="active percentage",
        description="Clinical grade 5.0% nicotinamide proven to improve tone and strengthen skin lipid barrier without flushing.",
        source_citation="Clinical Active Assay Certificate #NIC-5-2025",
        department_owner="Formulation Science",
        last_verified="2026-01-30",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording="Contains 5% high-purity niacinamide to strengthen skin barrier and even skin tone.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-013": ApprovedFact(
        id="FACT-013",
        brand_id="aurelle-tech",
        name="100% PCR Aluminum Outer Packaging Guarantee",
        category="SUSTAINABILITY",
        current_value="100% PCR Aluminum",
        unit="recycled metal",
        description="Infinitely recyclable post-consumer aluminum bottle minimizing cradle-to-gate carbon footprint by 78%.",
        source_citation="Global Green Materials Verification #SUS-AL-2025-01",
        department_owner="Sustainability",
        last_verified="2026-01-10",
        source_date="2025-06-01",
        expiry_date="2026-12-31",
        approved_wording="Housed in 100% post-consumer recycled aluminum, reducing virgin metal consumption.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-014": ApprovedFact(
        id="FACT-014",
        brand_id="aurelle-tech",
        name="Efficacy Retinol-Alternative Comparative Study",
        category="CLINICAL",
        current_value="2.4x gentler",
        unit="tolerance factor",
        description="Comparative irritation testing demonstrating 2.4-fold lower erythema index versus 0.5% synthetic retinol.",
        source_citation="Dr. Vance Clinical Trial #AUR-RET-2026-02",
        department_owner="Clinical Research",
        last_verified="2026-02-12",
        source_date="2026-01-15",
        expiry_date="2027-03-31",
        approved_wording="Clinically demonstrated 2.4x gentler than conventional 0.5% retinol while matching line-smoothing efficacy.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-015": ApprovedFact(
        id="FACT-015",
        brand_id="aurelle-tech",
        name="Hypoallergenic Patch Test Safety Clearance",
        category="SAFETY",
        current_value="0% Sensitization",
        unit="HRIPT score",
        description="50-subject human repeat insult patch test (HRIPT) conducted under dermatological supervision showing zero irritation.",
        source_citation="BioDerm Labs HRIPT Protocol #HRIPT-2025-AUR",
        department_owner="Safety & Toxicology",
        last_verified="2026-02-04",
        source_date="2025-12-01",
        expiry_date="2027-10-31",
        approved_wording="HRIPT patch tested under dermatologist supervision with zero reported allergic contact sensitization.",
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-016": ApprovedFact(
        id="FACT-016",
        brand_id="aurelle-tech",
        name="FSC Certified Secondary Packaging Cartons",
        category="SUSTAINABILITY",
        current_value="100% Recyclable Cartons",
        unit="FSC Mix Paperboard",
        description="All unit cartons made from 100% FSC-certified sustainably managed forestry stock and printed with vegetable soy inks.",
        source_citation="Forest Stewardship Council Chain of Custody #FSC-C14982",
        department_owner="Packaging Operations",
        last_verified="2026-01-20",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-017": ApprovedFact(
        id="FACT-017",
        brand_id="aurelle-tech",
        name="Microbiome Friendly Certification",
        category="CERTIFICATIONS",
        current_value="Microbiome Certified",
        unit="Standard 18.10",
        description="Rigorous testing showing formulation respects skin microbiome diversity, causing no harm to beneficial Staphylococcus epidermidis.",
        source_citation="MyMicrobiome Standard 18.10 Certificate #MMB-2026-301",
        department_owner="Biological Science",
        last_verified="2026-02-01",
        source_date="2026-02-01",
        expiry_date="2028-01-31",
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-018": ApprovedFact(
        id="FACT-018",
        brand_id="aurelle-tech",
        name="Centella Asiatica (Cica) Purity Standard",
        category="INGREDIENTS",
        current_value="95% Madecassoside",
        unit="extract purity",
        description="Ultra-purified Centella Asiatica titrated to 95% active madecassoside to soothe acute redness and barrier stress.",
        source_citation="PhytoPure Analytical Certificate #PPA-CICA-2026",
        department_owner="Raw Materials QC",
        last_verified="2026-02-01",
        source_date="2026-02-01",
        expiry_date="2027-12-31",
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-019": ApprovedFact(
        id="FACT-019",
        brand_id="aurelle-tech",
        name="Blue Light Protection Factor (BLPF)",
        category="CLINICAL",
        current_value="78% HEV attenuation",
        unit="photobiology rating",
        description="In-vitro testing demonstrating 78% attenuation of oxidative stress triggers from 400nm-490nm high-energy visible light.",
        source_citation="Photobiology Research Lab Dossier #PRL-HEV-2026-01",
        department_owner="Photobiology R&D",
        last_verified="2026-02-01",
        source_date="2026-02-01",
        expiry_date="2028-01-31",
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-020": ApprovedFact(
        id="FACT-020",
        brand_id="aurelle-tech",
        name="Peri-Orbital Ophthalmology Safety Clearance",
        category="SAFETY",
        current_value="Ophthalmologist Tested",
        unit="ocular safety",
        description="Clinical evaluation confirming formula is safe for delicate skin near eye contour without stinging or ocular discomfort.",
        source_citation="Ophthalmic Research Cohort Study #OPH-2025-09",
        department_owner="Clinical Safety",
        last_verified="2026-01-15",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-021": ApprovedFact(
        id="FACT-021",
        brand_id="aurelle-tech",
        name="ISO 22716 Cosmetics GMP Facility Certification",
        category="QUALITY",
        current_value="ISO 22716 Certified",
        unit="GMP standard",
        description="All manufacturing and filling lines certified under ISO 22716 Good Manufacturing Practices for cosmetics.",
        source_citation="TÜV Rheinland ISO 22716 Certificate #GMP-AUR-2025",
        department_owner="Quality Assurance",
        last_verified="2026-01-10",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-022": ApprovedFact(
        id="FACT-022",
        brand_id="aurelle-tech",
        name="Zero Heavy Metals ICP-MS Safety Screening",
        category="SAFETY",
        current_value="<0.1 ppm",
        unit="ICP-MS limit",
        description="Heavy metals (lead, arsenic, cadmium, mercury) screened via inductively coupled plasma mass spectrometry below 0.1 ppm.",
        source_citation="Inductively Coupled Plasma Mass Spectrometry Batch Log #ICP-2026-01",
        department_owner="Analytical Chemistry",
        last_verified="2026-01-25",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-023": ApprovedFact(
        id="FACT-023",
        brand_id="aurelle-tech",
        name="Waterless Organic Aloe Barbadensis Base",
        category="FORMULATION",
        current_value="Organic Aloe Base",
        unit="carrier base",
        description="Formulated without filler tap water; employs cold-pressed organic aloe barbadensis leaf juice as hydrating active carrier.",
        source_citation="Formulation Base Analysis #BAS-AUR-2025-04",
        department_owner="Formulation Science",
        last_verified="2026-01-18",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-024": ApprovedFact(
        id="FACT-024",
        brand_id="aurelle-tech",
        name="Airless Vacuum Dispenser Mechanism",
        category="PACKAGING",
        current_value="Zero-Air Piston",
        unit="vacuum mechanism",
        description="Piston-driven hermetic packaging prevents ambient oxygen exposure, maintaining antioxidant potency without chemical stabilizers.",
        source_citation="Packaging Engineering Specifications #PKG-AUR-VAC-02",
        department_owner="Packaging Engineering",
        last_verified="2026-01-14",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-025": ApprovedFact(
        id="FACT-025",
        brand_id="aurelle-tech",
        name="Carbon Neutral Outbound Shipping Milestone",
        category="SUSTAINABILITY",
        current_value="Net Zero Logistics",
        unit="carbon offset",
        description="100% of customer direct deliveries offset through certified high-permanence biochar carbon removal projects.",
        source_citation="SGS Carbon Footprint Verification #SGS-LOG-2026-04",
        department_owner="Logistics & ESG",
        last_verified="2026-01-05",
        source_date="2026-01-01",
        expiry_date="2026-12-31",
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-026": ApprovedFact(
        id="FACT-026",
        brand_id="aurelle-tech",
        name="Ceramide NP/AP/EOP Ratio Integrity",
        category="FORMULATION",
        current_value="3:1:1 physiological ratio",
        unit="ceramide molar ratio",
        description="Synthesized multi-ceramide complex adhering to the exact 3:1:1 molar ratio observed in healthy human epidermal bilayers.",
        source_citation="Lipid Matrix Chromatography Dossier #LMC-2025-08",
        department_owner="Formulation Science",
        last_verified="2026-01-15",
        source_date="2025-11-01",
        expiry_date="2027-09-30",
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-027": ApprovedFact(
        id="FACT-027",
        brand_id="aurelle-tech",
        name="Thermal Spring Mineral Water Profile",
        category="INGREDIENTS",
        current_value="Rich in Selenium & Silica",
        unit="mineral assay",
        description="Sourced from alpine thermal springs with 450mg/L dissolved minerals known to soothe inflamed epidermal receptors.",
        source_citation="Mineral Hydrotherapy Analysis #MHA-2025-99",
        department_owner="Raw Materials QC",
        last_verified="2026-01-20",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-028": ApprovedFact(
        id="FACT-028",
        brand_id="aurelle-tech",
        name="Dermatologist Recommendation Survey 2026",
        category="CLINICAL",
        current_value="91% recommended",
        unit="agreement score",
        description="Blind survey of 500 board-certified dermatologists confirming 91% would recommend Aurelle for dry, compromised skin.",
        source_citation="Independent Dermatology Panel Survey #DERM-2026-N500",
        department_owner="Clinical Research",
        last_verified="2026-03-01",
        source_date="2026-03-01",
        expiry_date="2026-12-31",
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-029": ApprovedFact(
        id="FACT-029",
        brand_id="aurelle-tech",
        name="Q3 2026 Hydration Launch Promotional Pricing",
        category="PRICING",
        current_value="20% off bundles",
        unit="promotional tier",
        description="Introductory promotional discount for seasonal bundle campaign. Expired on September 30, 2026; past this date, posts cannot cite this price.",
        source_citation="Commercial Launch Circular #AUR-2026-Q3-PROMO",
        department_owner="Marketing",
        last_verified="2026-09-30",
        source_date="2026-06-01",
        expiry_date="2026-09-30",
        approved_wording=None,
        is_confidential=False,
        status="EXPIRED"
    ),
    "FACT-030": ApprovedFact(
        id="FACT-030",
        brand_id="aurelle-tech",
        name="EWG Verified™ Certification Status",
        category="CERTIFICATIONS",
        current_value="EWG Verified Score 1",
        unit="hazard safety tier",
        description="Annual environmental safety verification confirming formula contains zero chemicals of concern per EWG guidelines.",
        source_citation="Environmental Working Group Verification Registry #EWG-AUR-2026",
        department_owner="Regulatory Affairs",
        last_verified="2026-01-08",
        source_date="2026-01-01",
        expiry_date="2026-12-31",
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-031": ApprovedFact(
        id="FACT-031",
        brand_id="aurelle-tech",
        name="Fitzpatrick Phototype Multi-Diversity Validation",
        category="CLINICAL",
        current_value="Fitzpatrick I-VI",
        unit="diversity cohort",
        description="Clinical trial cohort representing all six Fitzpatrick skin phototypes with zero post-inflammatory hyperpigmentation recorded.",
        source_citation="Clinical Diversity Trial Log #CDT-2025-FITZ",
        department_owner="Clinical Research",
        last_verified="2026-01-20",
        source_date="2025-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-032": ApprovedFact(
        id="FACT-032",
        brand_id="aurelle-tech",
        name="Autumn Barrier Defense Limited Edition Packaging",
        category="PACKAGING",
        current_value="Recyclable amber glass",
        unit="seasonal packaging",
        description="Special autumn seasonal run housed in UV-filtering recyclable amber glass. Active through November 30, 2026.",
        source_citation="Packaging Engineering Directive #PKG-2026-09",
        department_owner="Product Development",
        last_verified="2026-09-01",
        source_date="2026-09-01",
        expiry_date="2026-11-30",
        approved_wording=None,
        is_confidential=False,
        status="ACTIVE"
    ),
    "FACT-033": ApprovedFact(
        id="FACT-033",
        brand_id="aurelle-tech",
        name="Embargoed Q4 2026 Peptide Complex Reveal",
        category="CONFIDENTIAL",
        current_value="Patent-Pending Tri-Peptide",
        unit="intellectual property",
        description="Confidential formulation patent. Visible only to reviewers, compliance, and brand owner. Agency writers cannot view directly.",
        source_citation="Aurelle IP Patent Filing #PCT/US2026/049182",
        department_owner="Executive Brand Governance",
        last_verified="2026-02-01",
        source_date="2026-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=True,
        status="ACTIVE"
    ),
    "FACT-034": ApprovedFact(
        id="FACT-034",
        brand_id="aurelle-tech",
        name="In-Vitro Collagen Synthesis Stimulation Claim",
        category="CLINICAL",
        current_value="Up to 160% in vitro",
        unit="preclinical assay",
        description="Unverified preliminary finding awaiting third-party peer review. Cannot be used in consumer marketing until verified.",
        source_citation="Awaiting Third-Party Lab Clearance #PEND-COLL-2026",
        department_owner="Translational Biology",
        last_verified="2026-02-01",
        source_date="2026-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=False,
        status="UNVERIFIED"
    ),
    "FACT-035": ApprovedFact(
        id="FACT-035",
        brand_id="aurelle-tech",
        name="24-Hour Airborne PM2.5 Pollution Barrier",
        category="CLINICAL",
        current_value="PM2.5 adhesion resistance",
        unit="chamber assay",
        description="Unverified claim regarding fine atmospheric particulate shielding. Currently undergoing environmental chamber audit.",
        source_citation="Awaiting Aerosol Chamber Validation #PEND-PM25-2026",
        department_owner="Environmental Testing",
        last_verified="2026-02-01",
        source_date="2026-01-01",
        expiry_date=None,
        approved_wording=None,
        is_confidential=False,
        status="UNVERIFIED"
    )
}
