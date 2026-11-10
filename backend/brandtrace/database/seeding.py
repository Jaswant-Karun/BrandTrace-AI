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
    Idempotent seeding for the fictional luxury enterprise:
    Aurelle Maison & Botanicals Global (ORG-AURELLE / aurelle-maison).
    Never overwrites existing records if already seeded.
    """
    org_id = "ORG-AURELLE"
    workspace_id = "aurelle-maison"

    # Check if already seeded (non-destructive)
    existing_org = await repo.get_organisation(org_id)
    if existing_org:
        logger.info(f"Organisation '{org_id}' already seeded. Skipping destructive rewrite.")
        return {"status": "ALREADY_SEEDED", "org_id": org_id, "workspace_id": workspace_id}

    # 1. Create Organisation
    org_doc = OrganisationDoc(
        organisation_id=org_id,
        name="Aurelle Maison & Botanicals Global",
        slug="aurelle",
        tier="LUXURY_SUSTAINABLE_ENTERPRISE",
        industry="Eco-Luxury Cosmetics & Fine Fragrance",
        settings={"data_residency": "EU_WEST", "compliance_profile": "COSMOS_ORGANIC_STRICT"}
    )
    await repo.create_organisation(org_doc)

    # 2. Create Brand Workspace
    ws_doc = BrandWorkspaceDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        name="Aurelle Maison",
        slug="aurelle-maison",
        description="Prestige bio-fermented skincare and fine botanical fragrances formulated under strict organic certification.",
        primary_color="#1E293B",
        accent_color="#D97706"
    )
    await repo.create_workspace(ws_doc)

    # 3. Add Brand Guidelines
    g1 = BrandGuidelineDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        guideline_id="GL-AUR-01",
        title="COSMOS Organic Formulation Mandate",
        category="REGULATORY",
        rule_statement="All leave-on skincare copy must carry explicit ECOCERT Greenlife registration #ECO-2026-FR; standalone 'chemical-free' phrasing is strictly prohibited.",
        severity="CRITICAL"
    )
    g2 = BrandGuidelineDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        guideline_id="GL-AUR-02",
        title="Eco-Flacon Recycled Glass Protocol",
        category="SUSTAINABILITY",
        rule_statement="Product packaging claims must state minimum 45% post-consumer recycled glass; unqualified 'zero-impact packaging' claims are banned under EU Directive 2024/825.",
        severity="HIGH"
    )
    await repo.add_brand_guideline(g1)
    await repo.add_brand_guideline(g2)

    # 4. Add Approved Facts
    f1 = ApprovedFactDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        fact_id="FACT-AUR-BIO-01",
        category="INGREDIENT",
        name="Bio-Fermented Hyaluronic Acid Concentration",
        current_value="98.4%",
        unit="bio-fermented organic concentration",
        description="Derived from non-GMO wheat substrate certified under ECOCERT Greenlife standard.",
        source_citation="ECOCERT Greenlife Certification Dossier #ECO-2026-FR",
        department_owner="Formulation & Regulatory Affairs",
        last_verified="2026-02-10"
    )
    f2 = ApprovedFactDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        fact_id="FACT-AUR-GLS-01",
        category="SPECIFICATION",
        name="Flacon Post-Consumer Recycled Content",
        current_value="45%",
        unit="PCR glass",
        description="Primary flacons manufactured using minimum 45% post-consumer recycled culinary-grade glass.",
        source_citation="Bureau Veritas ISO 14021:2016 Packaging Audit #BV-2026-PKG",
        department_owner="Sustainable Packaging Engineering",
        last_verified="2026-01-20"
    )
    f3 = ApprovedFactDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        fact_id="FACT-AUR-PRC-01",
        category="PRICE",
        name="Retinol-Alternative Night Elixir 50ml MSRP",
        current_value="₹3,499",
        unit="MSRP retail",
        description="Official retail price for 50ml Night Elixir across authorized boutique distribution.",
        source_citation="Global Commercial Resolution #AUR-2026-Q1-PRC",
        department_owner="Global Commercial Operations",
        last_verified="2026-01-15"
    )
    await repo.add_approved_fact(f1)
    await repo.add_approved_fact(f2)
    await repo.add_approved_fact(f3)

    # Index embeddings into Atlas Vector store for Aurelle facts
    for fact in [f1, f2, f3]:
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

    # 5. Add Content Assets
    a1 = ContentAssetDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        asset_id="AST-AUR-01",
        campaign_id="CMP-AUR-2026-Q1",
        title="Vogue Double-Spread: Bio-Fermented Radiance",
        channel="OOH Billboard",
        raw_content="Formulated with 98.4% bio-fermented hyaluronic acid and packaged in 45% PCR recycled glass. Aurelle arrives.",
        content_hash="6c9201f80e9f3b",
        current_version="1.0"
    )
    a2 = ContentAssetDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        asset_id="AST-AUR-02",
        campaign_id="CMP-AUR-2026-Q1",
        title="Sephora Endcap Display: Night Elixir",
        channel="Digital Display",
        raw_content="Aurelle Night Elixir 50ml at ₹3,499. Experience certified organic regenerative botanicals.",
        content_hash="3a8820c74b9e11",
        current_version="1.0"
    )
    a3 = ContentAssetDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        asset_id="AST-AUR-03",
        campaign_id="CMP-AUR-2026-Q1",
        title="Influencer Reel Script: Clean Miracle (Drifted)",
        channel="Social Media",
        raw_content="Discover the 100% chemical-free zero-impact miracle serum by Aurelle for only ₹3,499.",
        content_hash="9f1140e2b3c76a",
        current_version="1.0"
    )
    await repo.save_content_asset(a1)
    await repo.save_content_asset(a2)
    await repo.save_content_asset(a3)

    # 6. Graph Relationships (DAG)
    r1 = GraphRelationshipDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        source_node_id="AST-AUR-01",
        target_node_id="FACT-AUR-BIO-01",
        relationship_type="DEPENDS_ON_FACT",
        evidence="Vogue copy asserts 98.4% bio-fermented hyaluronic acid"
    )
    r2 = GraphRelationshipDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        source_node_id="AST-AUR-01",
        target_node_id="FACT-AUR-GLS-01",
        relationship_type="DEPENDS_ON_FACT",
        evidence="Vogue copy asserts 45% PCR recycled glass content"
    )
    r3 = GraphRelationshipDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        source_node_id="AST-AUR-02",
        target_node_id="FACT-AUR-PRC-01",
        relationship_type="DEPENDS_ON_FACT",
        evidence="Sephora display lists official ₹3,499 MSRP"
    )
    r4 = GraphRelationshipDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        source_node_id="AST-AUR-03",
        target_node_id="GL-AUR-01",
        relationship_type="GOVERNED_BY_GUIDELINE",
        evidence="Influencer copy violates GL-AUR-01 prohibited terminology ('100% chemical-free')"
    )
    await repo.create_graph_relationship(r1)
    await repo.create_graph_relationship(r2)
    await repo.create_graph_relationship(r3)
    await repo.create_graph_relationship(r4)

    # 7. Inspection Job & Findings on Drifted Asset (AST-AUR-03)
    job = InspectionJobDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        job_id="JOB-AUR-03",
        asset_id="AST-AUR-03",
        findings_count=2,
        composite_risk_score=88.0
    )
    f_finding = InspectionFindingDoc(
        organisation_id=org_id,
        workspace_id=workspace_id,
        job_id="JOB-AUR-03",
        asset_id="AST-AUR-03",
        finding_category="STATUTORY_VIOLATION",
        severity="CRITICAL",
        exact_text="100% chemical-free",
        explanation="Prohibited under COSMOS Guideline GL-AUR-01 and FTC deceptive claims guidance; cosmetic substances are chemical compounds by definition.",
        relevant_rule_or_fact_id="GL-AUR-01",
        confidence=0.99
    )
    await repo.save_inspection_job_and_findings(job, [f_finding])

    logger.info(f"Successfully seeded enterprise organisation '{org_id}' ({workspace_id}).")
    return {
        "status": "SUCCESSFULLY_SEEDED",
        "org_id": org_id,
        "workspace_id": workspace_id,
        "guidelines": 2,
        "facts": 3,
        "assets": 3,
        "relationships": 4
    }
