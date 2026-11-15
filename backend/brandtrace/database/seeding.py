import time
import logging
from typing import Dict, Any, List, Optional
from brandtrace.database.repository import BrandTraceRepository
from brandtrace.database.schemas import (
    OrganisationDoc, BrandWorkspaceDoc, UserDoc, WorkspaceMembershipDoc,
    BrandGuidelineDoc, ApprovedFactDoc, FactSourceDoc, TerminologyDoc,
    BrandAssetDoc, CampaignDoc, ContentAssetDoc, GraphNodeDoc, GraphRelationshipDoc,
    InspectionJobDoc, InspectionFindingDoc, SuggestedCorrectionDoc
)
from brandtrace.engine.ai_provider import ai_provider

logger = logging.getLogger("brandtrace.database.seeding")

async def seed_aurelle_organisation(repo: BrandTraceRepository) -> Dict[str, Any]:
    """
    Idempotent seeding for the fictional premium consumer technology enterprise:
    Aurelle Technologies & Ambient Systems Global (ORG-AURELLE / aurelle-tech).
    Never overwrites existing records destructively.
    """
    org_id = "ORG-AURELLE"
    workspace_id = "aurelle-tech"

    # 1. Create or verify Organisation
    existing_org = await repo.get_organisation(org_id)
    if not existing_org:
        org_doc = OrganisationDoc(
            organisation_id=org_id,
            name="Aurelle Technologies & Ambient Systems Global",
            slug="aurelle-tech",
            tier="ENTERPRISE_TIER_1",
            industry="Premium Consumer Electronics & Spatial Audio",
            settings={"data_residency": "US_WEST", "compliance_profile": "ENTERPRISE_CONSUMER_HARDWARE"}
        )
        await repo.create_organisation(org_doc)

    # 2. Check if aurelle-tech workspace is already seeded
    existing_ws = await repo.get_workspace(org_id, workspace_id)
    if existing_ws:
        logger.info(f"Workspace '{workspace_id}' already seeded in organisation '{org_id}'.")
        return {"status": "ALREADY_SEEDED", "org_id": org_id, "workspace_id": workspace_id}

    # Create Brand Workspace
    ws_doc = BrandWorkspaceDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        name="Aurelle Technologies",
        slug="aurelle-tech",
        description="Aerospace titanium smart wearables, studio-grade lossless acoustics, and ambient cloud intelligence.",
        primary_color="#0A0E1A",
        accent_color="#06B6D4"
    )
    await repo.create_workspace(ws_doc)

    # 3. Seed 5 Demo Users & Memberships
    demo_users = [
        ("USR-AUR-ADM", "admin@aurelle.com", "Sarah Chen", "ADMIN"),
        ("USR-AUR-BM", "brandmanager@aurelle.com", "Julian Vance", "BRAND_MANAGER"),
        ("USR-AUR-CRT", "creator@aurelle.com", "Maya Lin", "CREATOR"),
        ("USR-AUR-REV", "reviewer@aurelle.com", "Marcus Aurelius", "REVIEWER"),
        ("USR-AUR-CMP", "compliance@aurelle.com", "David Sterling", "COMPLIANCE_REVIEWER"),
    ]
    for uid, email, name, role in demo_users:
        u_doc = UserDoc(
            user_id=uid,
            organisation_id=org_id,
            email=email,
            name=name,
            role=role
        )
        await repo.create_user(u_doc)
        m_doc = WorkspaceMembershipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            user_id=uid,
            role=role
        )
        await repo.add_workspace_membership(m_doc)

    # 4. Add Brand Guidelines
    guidelines = [
        BrandGuidelineDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            guideline_id="GL-AUR-01",
            title="Logo Safe Zone Clearance Mandate",
            category="VISUAL_IDENTITY",
            rule_statement="All marketing collateral and visual layouts must maintain a minimum 20px clear margin around the Aurelle wordmark.",
            severity="HIGH"
        ),
        BrandGuidelineDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            guideline_id="GL-AUR-02",
            title="Approved Master Color Palette",
            category="VISUAL_IDENTITY",
            rule_statement="Approved brand colors: Obsidian Black (#0A0E1A), Titanium Grey (#8A95A5), Champagne Gold (#D4AF37). Neon hues like #FF5500 strictly prohibited.",
            severity="CRITICAL"
        ),
        BrandGuidelineDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            guideline_id="GL-AUR-03",
            title="FDA 21 CFR §870 Non-Diagnostic Wellness Rule",
            category="REGULATORY",
            rule_statement="Pulse Smart Ring is a consumer general wellness monitor. Describing it as a medical-grade diagnostic cure or treating heart disease triggers federal action.",
            severity="CRITICAL"
        ),
        BrandGuidelineDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            guideline_id="GL-AUR-04",
            title="Battery Life Statutory Testing Disclosure",
            category="LEGAL_DISCLOSURE",
            rule_statement="Any claim stating 72-hour battery life must append the mandatory footnote: 'Tested under IEC 62133 standardized lab protocol. Actual results vary.'",
            severity="HIGH"
        ),
        BrandGuidelineDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            guideline_id="GL-AUR-05",
            title="QuantumAcoustics™ Trademark Policy",
            category="INTELLECTUAL_PROPERTY",
            rule_statement="QuantumAcoustics™ must always include the ™ trademark symbol. Product name is Aurelle Horizon, never Aurelle Horizun.",
            severity="HIGH"
        ),
        BrandGuidelineDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            guideline_id="GL-AUR-06",
            title="Global Master Typography Directive",
            category="TYPOGRAPHY",
            rule_statement="Headlines must utilize Editorial Serif typography; body copy and UI must utilize Inter Enterprise. Conflicting regional font rules yield to Master Rule.",
            severity="MODERATE"
        ),
        BrandGuidelineDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            guideline_id="GL-AUR-07",
            title="WCAG 2.1 AA Accessibility Mandate",
            category="ACCESSIBILITY",
            rule_statement="All digital consumer touchpoints must maintain minimum 4.5:1 text-to-background contrast and provide descriptive alt-text.",
            severity="HIGH"
        )
    ]
    for g in guidelines:
        await repo.add_brand_guideline(g)

    # 5. Add Approved Facts
    f1 = ApprovedFactDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        fact_id="FACT-AUR-PRC-01",
        category="PRICE",
        name="Aurelle Cloud Studio Subscription Price",
        current_value="₹499",
        unit="per creator / month",
        description="Official entry price point for Aurelle Cloud Studio audio and spatial mastering suite.",
        source_citation="Aurelle Commercial Committee Resolution #2026-Q1-AUR",
        department_owner="Pricing & Commercial Operations",
        last_verified="2026-01-15"
    )
    f2 = ApprovedFactDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        fact_id="FACT-AUR-BAT-01",
        category="SPECIFICATION",
        name="Horizon Watch Continuous Battery Life",
        current_value="72 hours",
        unit="continuous runtime",
        description="Standardized continuous runtime under IEC 62133 certified laboratory testing.",
        source_citation="IEC 62133 Standard Lab Protocol #AUR-LAB-BAT-72H",
        department_owner="Hardware Engineering",
        last_verified="2026-02-01"
    )
    f3 = ApprovedFactDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        fact_id="FACT-AUR-AUD-01",
        category="SPECIFICATION",
        name="QuantumAcoustics™ Audio Resolution",
        current_value="24-bit 192kHz",
        unit="lossless spatial audio",
        description="Mastering-grade lossless digital acoustic pipeline certified for studio audio reproduction.",
        source_citation="Acoustics Certification Dossier #AUR-AC-994",
        department_owner="Acoustics Engineering",
        last_verified="2026-01-28"
    )
    f4 = ApprovedFactDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        fact_id="FACT-AUR-TIT-01",
        category="SPECIFICATION",
        name="Horizon Watch Metallurgy Specification",
        current_value="Grade 5 Aerospace Titanium",
        unit="metallurgy grade",
        description="ASTM B265 Grade 5 Aerospace Titanium milled enclosure with PVD diamond-like carbon finish.",
        source_citation="ASTM B265 Grade 5 Titanium Certification #TIT-2026-08",
        department_owner="Industrial Design",
        last_verified="2026-01-10"
    )
    f5 = ApprovedFactDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        fact_id="FACT-AUR-EXP-01",
        category="PROMOTION",
        name="Free 2025 Cloud Studio Founder Trial",
        current_value="₹0 for 6 months",
        unit="promotional tier",
        description="Introductory trial tier that officially expired on December 31, 2025.",
        source_citation="Aurelle Founder Growth Promotion #2025-FNDR",
        department_owner="Growth Marketing",
        last_verified="2025-12-31"
    )
    for fact in [f1, f2, f3, f4, f5]:
        await repo.add_approved_fact(fact)

        # Index vector embedding into Atlas Vector Search store
        vec = await ai_provider.get_embedding(f"{fact.category}: {fact.name} {fact.current_value} - {fact.description}")
        if repo.mm.is_connected and repo.mm.db is not None:
            await repo.mm.db.knowledge_nodes.update_one(
                {"organisation_id": org_id, "node_id": fact.fact_id},
                {"$set": {
                    "embedding": vec,
                    "label": f"{fact.name}: {fact.current_value}",
                    "node_type": "APPROVED_FACT",
                    "description": fact.description
                }},
                upsert=True
            )
        repo.mm._memory_embeddings.append({
            "node_id": fact.fact_id,
            "org_id": org_id,
            "workspace_id": workspace_id,
            "label": f"{fact.name}: {fact.current_value}",
            "node_type": "APPROVED_FACT",
            "description": fact.description,
            "embedding": vec
        })

    # 6. Add Content Assets (Citing ₹499 Price)
    assets = [
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-AUR-AD-01",
            campaign_id="CMP-AUR-01",
            title="OOH Billboard: 72h Continuous Battery",
            channel="OOH Billboard",
            raw_content="72h Continuous Battery. Grade 5 Aerospace Titanium. Aurelle Horizon Watch Ultra arrives.",
            content_hash="a1b2c3d4e5f6",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-AUR-AD-02",
            campaign_id="CMP-AUR-02",
            title="Meta Feed Ad: Cloud Studio at ₹499/mo",
            channel="Instagram / Meta Feed Ads",
            raw_content="Scale your creative workflows with Aurelle Cloud Studio. Spatial audio mastering starting at just ₹499/month.",
            content_hash="6c9201f80e9f",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-AUR-AD-03",
            campaign_id="CMP-AUR-02",
            title="Google PPC Ad: Cloud Studio from ₹499",
            channel="Google Search Ads",
            raw_content="Official Aurelle Cloud Studio | AI-Powered Spatial Audio Mastering from ₹499/mo. 14-Day Enterprise Trial.",
            content_hash="3a8820c74b9e",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-AUR-WEB-01",
            campaign_id="CMP-AUR-02",
            title="Aurelle Cloud Studio Pricing & Checkout Page",
            channel="Official Website (aurelle.com/pricing)",
            raw_content="Creator Pro Tier: ₹499 per creator billed monthly. Includes full QuantumAcoustics™ spatial mastering.",
            content_hash="9f1140e2b3c7",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-AUR-DOC-01",
            campaign_id="CMP-AUR-02",
            title="B2B Enterprise Rate Card & Licensing PDF",
            channel="PDF Document / Sales Collateral",
            raw_content="Commercial Specification Document: Enterprise studio seat licensing is fixed at ₹499/seat monthly under annual agreement.",
            content_hash="7e2219d44a88",
            current_version="1.0"
        )
    ]
    for a in assets:
        await repo.save_content_asset(a)

    # 7. Add 9 Demonstration Test Case Assets
    case_assets = [
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-CASE-01",
            campaign_id="CMP-AUR-01",
            title="Case 1: Unsupported Claim (100% Unbreakable)",
            channel="Social Media",
            raw_content="Aurelle Horizon Watch Ultra is 100% unbreakable and completely indestructible in all extreme physical environments.",
            content_hash="case01hash",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-CASE-02",
            campaign_id="CMP-AUR-02",
            title="Case 2: Expired Approved Fact (2025 Founder Promo)",
            channel="Email Marketing",
            raw_content="Claim your Aurelle Cloud Studio subscription for ₹0 free for 6 months under the Founder Launch Trial.",
            content_hash="case02hash",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-CASE-03",
            campaign_id="CMP-AUR-01",
            title="Case 3: Naming Defect (Horizun & Missing TM)",
            channel="Digital Display",
            raw_content="Experience the revolutionary Aurelle Horizun Watch with QuantumAcoustics spatial sound streaming.",
            content_hash="case03hash",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-CASE-04",
            campaign_id="CMP-AUR-01",
            title="Case 4: Prohibited Terminology (Medical Diagnostic Cure)",
            channel="Social Media Ads",
            raw_content="Aurelle Pulse Smart Ring is a medical-grade diagnostic cure that eliminates all symptoms of cardiovascular disease.",
            content_hash="case04hash",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-CASE-05",
            campaign_id="CMP-AUR-01",
            title="Case 5: Logo Inconsistency (12px Clearance < 20px)",
            channel="Digital Banner",
            raw_content="Visual asset rendered with 12px padding clearance around Aurelle wordmark.",
            content_hash="case05hash",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-CASE-06",
            campaign_id="CMP-AUR-02",
            title="Case 6: Off-Palette Color (Neon Orange #FF5500)",
            channel="Web Landing Page",
            raw_content="Hero banner formatted with primary accent Neon Orange #FF5500 background.",
            content_hash="case06hash",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-CASE-07",
            campaign_id="CMP-AUR-01",
            title="Case 7: Missing Statutory Disclosure (IEC 62133)",
            channel="Print Catalog",
            raw_content="Enjoy 72-hour continuous battery life on single charge without interruptions.",
            content_hash="case07hash",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-CASE-08",
            campaign_id="CMP-AUR-02",
            title="Case 8: Accessibility Failure (Low Contrast 2.3:1 & Missing Alt)",
            channel="Website Hero",
            raw_content="Promotional web banner with low-contrast #777777 body text on #333333 dark slate and missing alt-text.",
            content_hash="case08hash",
            current_version="1.0"
        ),
        ContentAssetDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            asset_id="AST-CASE-09",
            campaign_id="CMP-AUR-01",
            title="Case 9: Conflicting Brand Guidelines (Helvetica vs Editorial Serif)",
            channel="European Press Pack",
            raw_content="Press release authored in Helvetica Neue following regional EU guidelines in conflict with Global Master Rule GL-AUR-06.",
            content_hash="case09hash",
            current_version="1.0"
        )
    ]
    for ca in case_assets:
        await repo.save_content_asset(ca)

    # 8. Add DAG Graph Relationships
    relationships = [
        # Connected assets to FACT-AUR-PRC-01
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-AUR-AD-02",
            target_node_id="FACT-AUR-PRC-01",
            relationship_type="DEPENDS_ON_FACT",
            evidence="Meta Feed Ad cites ₹499 entry subscription"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-AUR-AD-03",
            target_node_id="FACT-AUR-PRC-01",
            relationship_type="DEPENDS_ON_FACT",
            evidence="Google PPC Ad features ₹499 monthly price point"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-AUR-WEB-01",
            target_node_id="FACT-AUR-PRC-01",
            relationship_type="DEPENDS_ON_FACT",
            evidence="Website checkout publishes Creator Pro tier at ₹499"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-AUR-DOC-01",
            target_node_id="FACT-AUR-PRC-01",
            relationship_type="DEPENDS_ON_FACT",
            evidence="Enterprise B2B Rate Card commits seat price to ₹499"
        ),
        # Test case relationships
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-CASE-01",
            target_node_id="PIL-AUR-01",
            relationship_type="DEPENDS_ON",
            evidence="Unsubstantiated 100% unbreakable claim"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-CASE-02",
            target_node_id="FACT-AUR-EXP-01",
            relationship_type="DEPENDS_ON_FACT",
            evidence="Email cites expired ₹0 founder trial"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-CASE-03",
            target_node_id="GL-AUR-05",
            relationship_type="DEPENDS_ON",
            evidence="Spelling error 'Horizun' and missing ™ mark"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-CASE-04",
            target_node_id="GL-AUR-03",
            relationship_type="DEPENDS_ON",
            evidence="Prohibited medical cure claim under FDA §870"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-CASE-05",
            target_node_id="GL-AUR-01",
            relationship_type="DEPENDS_ON",
            evidence="Logo clearance 12px < 20px minimum"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-CASE-06",
            target_node_id="GL-AUR-02",
            relationship_type="DEPENDS_ON",
            evidence="Unapproved neon orange #FF5500 background"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-CASE-07",
            target_node_id="GL-AUR-04",
            relationship_type="DEPENDS_ON",
            evidence="Missing mandatory IEC 62133 lab benchmark footnote"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-CASE-08",
            target_node_id="GL-AUR-07",
            relationship_type="DEPENDS_ON",
            evidence="Contrast ratio 2.3:1 fails WCAG 2.1 AA 4.5:1 minimum"
        ),
        GraphRelationshipDoc(
            organisation_id=org_id,
            workspace_id=workspace_id,
            source_node_id="AST-CASE-09",
            target_node_id="GL-AUR-06",
            relationship_type="DEPENDS_ON",
            evidence="Conflicting font rule: Helvetica vs Master Editorial Serif"
        )
    ]
    for rel in relationships:
        await repo.create_graph_relationship(rel)

    logger.info(f"Successfully seeded AURELLE enterprise organisation '{org_id}' ({workspace_id}).")
    return {
        "status": "SUCCESSFULLY_SEEDED",
        "org_id": org_id,
        "workspace_id": workspace_id,
        "guidelines": len(guidelines),
        "facts": 5,
        "assets": len(assets) + len(case_assets),
        "relationships": len(relationships),
        "users": len(demo_users)
    }
