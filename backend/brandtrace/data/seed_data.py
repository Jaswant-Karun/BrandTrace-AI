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
    )
}
