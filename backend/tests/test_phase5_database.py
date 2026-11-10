import pytest
import asyncio
from bson import ObjectId
from brandtrace.database.mongo import mongo_manager
from brandtrace.database.schemas import (
    OrganisationDoc, BrandWorkspaceDoc, BrandGuidelineDoc, ApprovedFactDoc,
    ContentAssetDoc, ContentVersionDoc, GraphRelationshipDoc,
    InspectionJobDoc, InspectionFindingDoc, ApprovalDecisionDoc
)
from brandtrace.database.seeding import seed_aurelle_organisation

@pytest.mark.anyio
async def test_phase5_create_and_retrieve_organisation():
    repo = mongo_manager.repo
    org_id = f"ORG-TEST-{ObjectId()}"
    org = OrganisationDoc(
        organisation_id=org_id,
        name="Lumina Automotive Holdings",
        slug="lumina-auto",
        tier="ENTERPRISE",
        industry="Autonomous Mobility"
    )
    created = await repo.create_organisation(org)
    assert created["organisation_id"] == org_id
    assert created["name"] == "Lumina Automotive Holdings"

    retrieved = await repo.get_organisation(org_id)
    assert retrieved is not None
    assert retrieved["name"] == "Lumina Automotive Holdings"

@pytest.mark.anyio
async def test_phase5_create_workspace():
    repo = mongo_manager.repo
    org_id = "ORG-APEX"
    ws_id = f"apex-fleet-{ObjectId()}"
    ws = BrandWorkspaceDoc(
        organisation_id=org_id,
        workspace_id=ws_id,
        name="Apex Commercial Fleet Systems",
        slug="apex-fleet",
        primary_color="#0F172A",
        accent_color="#38BDF8"
    )
    created = await repo.create_workspace(ws)
    assert created["workspace_id"] == ws_id

    retrieved = await repo.get_workspace(org_id, ws_id)
    assert retrieved is not None
    assert retrieved["name"] == "Apex Commercial Fleet Systems"

@pytest.mark.anyio
async def test_phase5_add_and_retrieve_brand_guideline():
    repo = mongo_manager.repo
    org_id = "ORG-AURELLE"
    guideline_id = f"GL-TEST-{ObjectId()}"
    gl = BrandGuidelineDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        guideline_id=guideline_id,
        title="Eco-Refill Flacon Integrity Standard",
        category="SUSTAINABILITY",
        rule_statement="All refill cartridges must guarantee zero virgin plastic and cite ISO 14021.",
        severity="HIGH"
    )
    await repo.add_brand_guideline(gl)

    guidelines = await repo.get_brand_guidelines(org_id, "aurelle-maison")
    assert any(g["guideline_id"] == guideline_id for g in guidelines)

@pytest.mark.anyio
async def test_phase5_add_approved_fact():
    repo = mongo_manager.repo
    org_id = "ORG-AURELLE"
    fact_id = f"FACT-TEST-{ObjectId()}"
    fact = ApprovedFactDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        fact_id=fact_id,
        category="SPECIFICATION",
        name="Cold-Pressed Rosa Damascena Active Yield",
        current_value="12.5mg/ml",
        unit="mg/ml active botanical",
        description="Standardized HPLC extraction yield from certified Grasse harvest.",
        source_citation="Certificate of Analysis #COA-2026-ROSA",
        department_owner="Botanical Phytochemistry",
        last_verified="2026-02-01"
    )
    await repo.add_approved_fact(fact)

    facts = await repo.get_approved_facts(org_id, "aurelle-maison")
    assert any(f["fact_id"] == fact_id for f in facts)

@pytest.mark.anyio
async def test_phase5_save_content_metadata_and_versions():
    repo = mongo_manager.repo
    org_id = "ORG-AURELLE"
    asset_id = f"AST-TEST-{ObjectId()}"

    # 1. Save Content Asset
    asset = ContentAssetDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        asset_id=asset_id,
        title="Print Ad: Spring Rose Nectar",
        channel="OOH Billboard",
        raw_content="Pure cold-pressed Rosa Damascena at 12.5mg/ml. Aurelle arrives.",
        content_hash="hash-v1-abc",
        current_version="1.0"
    )
    await repo.save_content_asset(asset)

    retrieved = await repo.get_content_asset(org_id, asset_id)
    assert retrieved is not None
    assert retrieved["title"] == "Print Ad: Spring Rose Nectar"

    # 2. Record Content Versions
    v1 = ContentVersionDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        asset_id=asset_id,
        version_label="v1.0",
        content_body="Original Draft",
        content_hash="hash-v1-abc",
        mutation_rationale="Initial creative copy staging"
    )
    v2 = ContentVersionDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        asset_id=asset_id,
        version_label="v2.0",
        content_body="Remediated Draft with COA verification",
        content_hash="hash-v2-def",
        mutation_rationale="COSMOS compliance alignment"
    )
    await repo.record_content_version(v1)
    await repo.record_content_version(v2)

    history = await repo.get_content_version_history(org_id, asset_id)
    assert len(history) >= 2
    assert history[0]["version_label"] == "v1.0"
    assert history[1]["version_label"] == "v2.0"

@pytest.mark.anyio
async def test_phase5_inspection_findings_persistence():
    repo = mongo_manager.repo
    org_id = "ORG-AURELLE"
    job_id = f"JOB-TEST-{ObjectId()}"
    asset_id = f"AST-TEST-{ObjectId()}"

    job = InspectionJobDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        job_id=job_id,
        asset_id=asset_id,
        findings_count=1,
        composite_risk_score=75.0
    )
    finding = InspectionFindingDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        job_id=job_id,
        asset_id=asset_id,
        finding_category="STATUTORY_VIOLATION",
        severity="HIGH",
        exact_text="100% natural miracle",
        explanation="Prohibited unqualified claim under cosmetic advertising standards.",
        relevant_rule_or_fact_id="GL-AUR-01",
        confidence=0.98
    )

    await repo.save_inspection_job_and_findings(job, [finding])

    findings = await repo.get_findings_for_asset(org_id, asset_id)
    assert len(findings) == 1
    assert findings[0]["exact_text"] == "100% natural miracle"

@pytest.mark.anyio
async def test_phase5_graph_relationships_and_dependency_traversal():
    repo = mongo_manager.repo
    org_id = "ORG-AURELLE"
    root_id = f"FACT-ROOT-{ObjectId()}"
    mid_id = f"AST-MID-{ObjectId()}"
    leaf_id = f"AST-LEAF-{ObjectId()}"

    # Edge 1: mid -> root
    e1 = GraphRelationshipDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        source_node_id=mid_id,
        target_node_id=root_id,
        relationship_type="DEPENDS_ON_FACT",
        evidence="Direct dependency"
    )
    # Edge 2: leaf -> mid
    e2 = GraphRelationshipDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        source_node_id=leaf_id,
        target_node_id=mid_id,
        relationship_type="REFERENCES_ASSET",
        evidence="Cascading derivative asset"
    )
    await repo.create_graph_relationship(e1)
    await repo.create_graph_relationship(e2)

    # Traverse downstream dependents starting from root
    dependents = await repo.traverse_dependent_assets(org_id, root_id)
    dep_sources = [d.get("source_node_id") for d in dependents]
    assert mid_id in dep_sources
    assert leaf_id in dep_sources

@pytest.mark.anyio
async def test_phase5_atomic_approval_decision():
    repo = mongo_manager.repo
    org_id = "ORG-AURELLE"
    asset_id = f"AST-APPROVE-{ObjectId()}"

    # Initial asset
    asset = ContentAssetDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        asset_id=asset_id,
        title="Pending Release Brochure",
        channel="Print",
        raw_content="Pending copy text",
        content_hash="hash-123",
        status="PENDING_REVIEW"
    )
    await repo.save_content_asset(asset)

    # Commit atomic approval decision
    decision = ApprovalDecisionDoc(
        organisation_id=org_id,
        workspace_id="aurelle-maison",
        decision_id=f"DEC-{ObjectId()}",
        asset_id=asset_id,
        reviewer_identity="Camille Laurent",
        reviewer_role="ADMIN",
        decision="APPROVED",
        rationale="All botanical claims verified against laboratory COA.",
        cryptographic_seal="BT-SEAL-AUR-778"
    )
    await repo.atomic_record_approval(decision)

    # Check asset status was atomically updated
    updated_asset = await repo.get_content_asset(org_id, asset_id)
    assert updated_asset is not None
    assert updated_asset["status"] == "APPROVED"

@pytest.mark.anyio
async def test_phase5_tenant_isolation_boundary():
    repo = mongo_manager.repo
    org_apex = "ORG-APEX"
    org_novus = "ORG-NOVUS"
    asset_id = f"AST-CONFIDENTIAL-{ObjectId()}"

    # Save asset under ORG-APEX
    asset = ContentAssetDoc(
        organisation_id=org_apex,
        workspace_id="apex-dynamics",
        asset_id=asset_id,
        title="Confidential 800V Powertrain Patent Spec",
        channel="Internal Whitepaper",
        raw_content="QuantumCell secret parameters",
        content_hash="secret-hash"
    )
    await repo.save_content_asset(asset)

    # 1. Fetching with correct org_id succeeds
    owner_fetch = await repo.get_content_asset(org_apex, asset_id)
    assert owner_fetch is not None
    assert owner_fetch["asset_id"] == asset_id

    # 2. Fetching with different org_id MUST RETURN NONE (Tenant Boundary Guaranteed)
    foreign_fetch = await repo.get_content_asset(org_novus, asset_id)
    assert foreign_fetch is None

@pytest.mark.anyio
async def test_phase5_aurelle_seeding():
    repo = mongo_manager.repo
    seed_result = await seed_aurelle_organisation(repo)
    assert seed_result["org_id"] == "ORG-AURELLE"
    assert seed_result["workspace_id"] == "aurelle-maison"

    # Verify seeded organisation exists
    aurelle_org = await repo.get_organisation("ORG-AURELLE")
    assert aurelle_org is not None
    assert "Aurelle Maison" in aurelle_org["name"]

    # Verify seeded guidelines exist
    gls = await repo.get_brand_guidelines("ORG-AURELLE", "aurelle-maison")
    assert len(gls) >= 2
    assert any("COSMOS" in g["title"] for g in gls)

    # Verify seeded facts exist
    facts = await repo.get_approved_facts("ORG-AURELLE", "aurelle-maison")
    assert len(facts) >= 3
    assert any("Hyaluronic Acid" in f["name"] for f in facts)
