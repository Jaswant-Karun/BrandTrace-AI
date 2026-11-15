from typing import Dict
from brandtrace.graph.schema import (
    BrandGraphData, Node, Edge, NodeType, EdgeType
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
            description="Registered trademark for proprietary cell chemistry. Must retain exact capitalization and ™ mark on first mention.",
            properties={"exact_mark": "QuantumCell™", "registered_territories": ["US", "EU", "JP", "UK"]}
        ),
        Node(
            id="TM-02",
            label="HyperDrive OS®",
            type=NodeType.TRADEMARK,
            description="Registered mark for vehicle central compute platform. Must never be abbreviated as 'HDOS'.",
            properties={"exact_mark": "HyperDrive OS®", "registered_territories": ["US", "EU"]}
        ),
        Node(
            id="TM-03",
            label="AeroGlide™",
            type=NodeType.TRADEMARK,
            description="Active aero suspension control algorithm mark.",
            properties={"exact_mark": "AeroGlide™"}
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
                "verification_status": "VALID",
                "qualifier_required": "EPA-estimated or WLTP combined cycle depending on jurisdiction"
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
        Node(
            id="AC-03",
            label="0.208 Drag Coefficient (Cd)",
            type=NodeType.APPROVED_CLAIM,
            description="0.208 Drag Coefficient independently verified in wind tunnel aerodynamic validation.",
            properties={
                "citation": "Stuttgart Aero Lab Report #STG-2025-04",
                "verified_date": "2025-08-19",
                "verification_status": "VALID"
            }
        ),
        Node(
            id="AC-04",
            label="85% post-consumer recycled aluminum chassis",
            type=NodeType.APPROVED_CLAIM,
            description="Structural chassis engineered using 85% certified recycled aluminum alloy.",
            properties={
                "citation": "TÜV Rheinland ISO 14021 Verification Report #TR-2025-AL85",
                "verified_date": "2025-09-30",
                "verification_status": "VALID"
            }
        ),
        # Prohibited Claims
        Node(
            id="PC-01",
            label="Zero-Carbon / 100% Eco-Friendly without qualification",
            type=NodeType.PROHIBITED_CLAIM,
            description="Blanket claims of 'Zero-Carbon' or '100% Eco-Friendly' violate FTC Green Guides §260.4 and EU Green Claims Directive COM/2023/166 unless electricity grid lifecycle and production impact are disclosed.",
            properties={
                "severity": "CRITICAL",
                "governing_policy": "FTC Green Guides §260.4 / EU Directive 2024/825",
                "forbidden_phrases": ["100% eco-friendly", "zero carbon footprint", "completely green", "zero emissions vehicle (without tailpipe qualifier)"]
            }
        ),
        Node(
            id="PC-02",
            label="Full Autonomous / Self-Driving without driver attention",
            type=NodeType.PROHIBITED_CLAIM,
            description="Claiming hands-free autonomous operation without requiring continuous driver vigilance triggers immediate NHTSA and California DMV regulatory sanctions.",
            properties={
                "severity": "CRITICAL",
                "governing_policy": "NHTSA Standing General Order 2021-01 / SAE J3016",
                "forbidden_phrases": ["fully autonomous", "self-driving without supervision", "relax while the car drives for you", "hands-off autopilot"]
            }
        ),
        Node(
            id="PC-03",
            label="The World's Fastest EV (Unqualified Superlative)",
            type=NodeType.PROHIBITED_CLAIM,
            description="Unsubstantiated absolute speed or acceleration superlatives without certified Guinness or FIA timing results create acute Lanham Act false advertising liability.",
            properties={
                "severity": "HIGH",
                "governing_policy": "Lanham Act §43(a) / ASA UK CAP Code Rule 3.1",
                "forbidden_phrases": ["fastest car in existence", "world's undisputed speed king", "destroys all competitors"]
            }
        ),
        # Regulations
        Node(
            id="REG-01",
            label="FTC Green Guides 16 CFR §260",
            type=NodeType.REGULATION,
            description="Federal Trade Commission standards governing environmental marketing claims, carbon offsets, and recyclability.",
            properties={"jurisdiction": "United States (Federal)", "enforcement_agency": "FTC"}
        ),
        Node(
            id="REG-02",
            label="EU Green Claims Directive (COM/2023/166)",
            type=NodeType.REGULATION,
            description="European Union directive mandating independent third-party scientific substantiation for all corporate sustainability claims.",
            properties={"jurisdiction": "European Union", "effective_date": "2026-03-01"}
        ),
        Node(
            id="REG-03",
            label="NHTSA SAE Level 2 Marketing Guardrail",
            type=NodeType.REGULATION,
            description="Automated driving system marketing guidance mandating clear consumer notification of human driver responsibility.",
            properties={"jurisdiction": "United States (Federal)", "enforcement_agency": "NHTSA"}
        ),
        # Campaigns
        Node(
            id="CMP-01",
            label="Spring 2026 Fleet Launch: The Precision Era",
            type=NodeType.CAMPAIGN,
            description="Global multi-channel flagship launch of the Apex GT Aerosedan.",
            properties={"quarter": "Q1 2026", "budget_usd": 12000000, "status": "LIVE"}
        ),
        Node(
            id="CMP-02",
            label="Global Out-of-Home (OOH) Range Awareness",
            type=NodeType.CAMPAIGN,
            description="High-visibility billboard and airport terminal installations highlighting 520-mile EPA range.",
            properties={"quarter": "Q1 2026", "channels": ["Billboard", "Airport Displays"], "status": "LIVE"}
        ),
        Node(
            id="CMP-03",
            label="Apex Sustainability & Closed-Loop Circularity",
            type=NodeType.CAMPAIGN,
            description="PR and ESG disclosures highlighting 85% recycled aluminum chassis and battery circularity.",
            properties={"quarter": "Q2 2026", "channels": ["Press Release", "Web", "Investor Deck"], "status": "STAGED"}
        ),
        # Assets
        Node(
            id="AST-01",
            label="Billboard: 520 Miles of Zero Compromise",
            type=NodeType.ASSET,
            description="Headline: '520 Miles of Zero Compromise. QuantumCell™ Battery Architecture. The Apex GT.'",
            properties={
                "channel": "Print / OOH Billboard",
                "campaign_id": "CMP-02",
                "status": "APPROVED",
                "content": "520 Miles of Zero Compromise. Powered by QuantumCell™ 800V Architecture. The Apex GT arrives."
            }
        ),
        Node(
            id="AST-02",
            label="Instagram Carousel: 14-Minute Supercharge",
            type=NodeType.ASSET,
            description="Social copy: 'Stop for coffee. Leave with 80% charge. 10% to 80% in 14 minutes with Apex HyperDrive.'",
            properties={
                "channel": "Social Media (Instagram/LinkedIn)",
                "campaign_id": "CMP-01",
                "status": "APPROVED",
                "content": "Stop for coffee. Leave with 80% charge. 10% to 80% in 14 minutes flat with QuantumCell™ on 350kW DC fast chargers."
            }
        ),
        Node(
            id="AST-03",
            label="YouTube Video Ad: Hands-Free Highway Cruising",
            type=NodeType.ASSET,
            description="Script claiming: 'Kick back and let HyperDrive pilot your commute hands-free without looking.'",
            properties={
                "channel": "Digital Video (YouTube)",
                "campaign_id": "CMP-01",
                "status": "REJECTED_BY_GATE",
                "content": "Kick back, relax, and let HyperDrive pilot your commute hands-free. Fully autonomous driving has finally arrived."
            }
        ),
        Node(
            id="AST-04",
            label="PR Wire: The Completely Eco-Friendly Super-Saloon",
            type=NodeType.ASSET,
            description="Draft press release: 'Apex Dynamics launches 100% eco-friendly zero-emissions super-saloon.'",
            properties={
                "channel": "PR Newswire / Investor Wire",
                "campaign_id": "CMP-03",
                "status": "FLAGGED_FOR_REMEDITATION",
                "content": "Apex Dynamics unveils the world's most completely eco-friendly vehicle with zero carbon footprint and 85% post-consumer recycled aluminum."
            }
        )
    ],
    edges=[
        # Brand -> Pillars
        Edge(source="BRD-APEX", target="PIL-01", type=EdgeType.DEFINES, label="core_pillar"),
        Edge(source="BRD-APEX", target="PIL-02", type=EdgeType.DEFINES, label="core_pillar"),
        Edge(source="BRD-APEX", target="PIL-03", type=EdgeType.DEFINES, label="core_pillar"),

        # Brand -> Trademarks
        Edge(source="BRD-APEX", target="TM-01", type=EdgeType.PROTECTS, label="owns_trademark"),
        Edge(source="BRD-APEX", target="TM-02", type=EdgeType.PROTECTS, label="owns_trademark"),
        Edge(source="BRD-APEX", target="TM-03", type=EdgeType.PROTECTS, label="owns_trademark"),

        # Pillars -> Tone
        Edge(source="PIL-01", target="TONE-01", type=EdgeType.MANDATES_TONE, label="mandates_precision"),
        Edge(source="PIL-02", target="TONE-02", type=EdgeType.MANDATES_TONE, label="mandates_sophistication"),
        Edge(source="PIL-03", target="TONE-03", type=EdgeType.MANDATES_TONE, label="mandates_safety_truth"),

        # Pillars -> Claims
        Edge(source="PIL-01", target="AC-01", type=EdgeType.SUBSTANTIATES, label="enables_range"),
        Edge(source="PIL-01", target="AC-02", type=EdgeType.SUBSTANTIATES, label="enables_charging"),
        Edge(source="PIL-02", target="AC-03", type=EdgeType.SUBSTANTIATES, label="enables_aero"),
        Edge(source="PIL-03", target="AC-04", type=EdgeType.SUBSTANTIATES, label="enables_circularity"),

        # Regulations -> Constraints
        Edge(source="REG-01", target="PC-01", type=EdgeType.CONSTRAINS, label="prohibits_greenwashing"),
        Edge(source="REG-02", target="PC-01", type=EdgeType.CONSTRAINS, label="mandates_lifecycle_proof"),
        Edge(source="REG-03", target="PC-02", type=EdgeType.CONSTRAINS, label="prohibits_l2_deception"),

        # Brand -> Campaigns
        Edge(source="BRD-APEX", target="CMP-01", type=EdgeType.GOVERNS, label="owns_campaign"),
        Edge(source="BRD-APEX", target="CMP-02", type=EdgeType.GOVERNS, label="owns_campaign"),
        Edge(source="BRD-APEX", target="CMP-03", type=EdgeType.GOVERNS, label="owns_campaign"),

        # Campaigns -> Assets
        Edge(source="CMP-02", target="AST-01", type=EdgeType.GOVERNS, label="deploys_asset"),
        Edge(source="CMP-01", target="AST-02", type=EdgeType.GOVERNS, label="deploys_asset"),
        Edge(source="CMP-01", target="AST-03", type=EdgeType.GOVERNS, label="deploys_asset"),
        Edge(source="CMP-03", target="AST-04", type=EdgeType.GOVERNS, label="deploys_asset"),

        # Assets -> Dependencies / Claims
        Edge(source="AST-01", target="AC-01", type=EdgeType.CONTAINS_CLAIM, label="cites_range"),
        Edge(source="AST-01", target="TM-01", type=EdgeType.DEPENDS_ON, label="references_tm"),
        Edge(source="AST-02", target="AC-02", type=EdgeType.CONTAINS_CLAIM, label="cites_charging"),
        Edge(source="AST-02", target="TM-01", type=EdgeType.DEPENDS_ON, label="references_tm"),
        Edge(source="AST-03", target="PC-02", type=EdgeType.DEPENDS_ON, label="violates_prohibited"),
        Edge(source="AST-04", target="PC-01", type=EdgeType.DEPENDS_ON, label="violates_greenwashing"),
        Edge(source="AST-04", target="AC-04", type=EdgeType.CONTAINS_CLAIM, label="cites_recycled_metal"),
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
            id="PIL-NH-01",
            label="Clinical Evidence-First Rigor",
            type=NodeType.PILLAR,
            description="Every health claim must be anchored to published, peer-reviewed, double-blind randomized clinical trial (RCT) evidence.",
            properties={"weight": 1.0}
        ),
        Node(
            id="TONE-NH-01",
            label="Empathetic & Medically Precise",
            type=NodeType.TONE_ATTRIBUTE,
            description="Scientific, objective, reassuring, strictly non-alarmist. Zero sensationalism or unsubstantiated wellness hype.",
            properties={"formality": "Clinical/Professional"}
        ),
        Node(
            id="TM-NH-01",
            label="CardioShield™",
            type=NodeType.TRADEMARK,
            description="Prescription oral small-molecule PCSK9 inhibitor brand name. Must include ™ mark.",
            properties={"exact_mark": "CardioShield™"}
        ),
        Node(
            id="AC-NH-01",
            label="Reduces ApoB by 38% in Phase III RCT",
            type=NodeType.APPROVED_CLAIM,
            description="Demonstrated a 38% mean reduction in circulating ApoB lipoproteins in 4,200 patient double-blind trial.",
            properties={
                "citation": "NEJM 2025; 392:1402-1411 (NCT05128912)",
                "verification_status": "VALID",
                "indication": "Adults with primary heterozygous hypercholesterolemia"
            }
        ),
        Node(
            id="PC-NH-01",
            label="Guaranteed Cure for Cardiovascular Disease",
            type=NodeType.PROHIBITED_CLAIM,
            description="Directly violates FDA 21 CFR §202.1 Fair Balance regulations. No prescription drug may claim to 'cure' chronic atherogenic disease.",
            properties={
                "severity": "CRITICAL",
                "governing_policy": "FDA 21 CFR §202.1 / FTC Health Guides",
                "forbidden_phrases": ["guaranteed cure", "reverses all heart disease", "100% side effect free", "miracle heart pill"]
            }
        ),
        Node(
            id="REG-NH-01",
            label="FDA 21 CFR §202.1 Fair Balance",
            type=NodeType.REGULATION,
            description="Mandates equal prominence of safety risks and contraindications whenever therapeutic benefits are communicated.",
            properties={"jurisdiction": "United States (FDA CDER)"}
        ),
        Node(
            id="CMP-NH-01",
            label="ApoB Awareness & Patient Horizon Campaign",
            type=NodeType.CAMPAIGN,
            description="Educational patient campaign highlighting lipid management and risk reduction.",
            properties={"quarter": "Q1 2026", "status": "LIVE"}
        ),
        Node(
            id="AST-NH-01",
            label="Patient Guide: Understanding Your Lipid Horizon",
            type=NodeType.ASSET,
            description="Brochure detailing ApoB management and CardioShield™ clinical results.",
            properties={
                "channel": "Print & Web Patient Guide",
                "campaign_id": "CMP-NH-01",
                "status": "APPROVED",
                "content": "Ask your cardiologist about CardioShield™. In a Phase III clinical trial, CardioShield™ lowered ApoB by up to 38% alongside standard statin therapy."
            }
        )
    ],
    edges=[
        Edge(source="BRD-NOVUS", target="PIL-NH-01", type=EdgeType.DEFINES),
        Edge(source="BRD-NOVUS", target="TM-NH-01", type=EdgeType.PROTECTS),
        Edge(source="PIL-NH-01", target="TONE-NH-01", type=EdgeType.MANDATES_TONE),
        Edge(source="PIL-NH-01", target="AC-NH-01", type=EdgeType.SUBSTANTIATES),
        Edge(source="REG-NH-01", target="PC-NH-01", type=EdgeType.CONSTRAINS),
        Edge(source="BRD-NOVUS", target="CMP-NH-01", type=EdgeType.GOVERNS),
        Edge(source="CMP-NH-01", target="AST-NH-01", type=EdgeType.GOVERNS),
        Edge(source="AST-NH-01", target="AC-NH-01", type=EdgeType.CONTAINS_CLAIM),
        Edge(source="AST-NH-01", target="TM-NH-01", type=EdgeType.DEPENDS_ON),
    ]
)

BRAND_SEEDS: Dict[str, BrandGraphData] = {
    "apex-dynamics": APEX_DYNAMICS_DATA,
    "novus-health": NOVUS_HEALTH_DATA,
}
