import logging
from pymongo import ASCENDING, DESCENDING, IndexModel
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger("brandtrace.database.indexes")

async def build_phase5_indexes(db: AsyncIOMotorDatabase):
    """
    Creates indexes across all 27 required MongoDB Atlas collections.
    Enforces multi-tenant isolation, unique constraints, and rapid DAG traversals.
    """
    try:
        # 1. users
        await db.users.create_index([("email", ASCENDING)], unique=True)
        await db.users.create_index([("organisation_id", ASCENDING), ("user_id", ASCENDING)], unique=True)

        # 2. organisations
        await db.organisations.create_index([("organisation_id", ASCENDING)], unique=True)
        await db.organisations.create_index([("slug", ASCENDING)], unique=True)

        # 3. workspace_memberships
        await db.workspace_memberships.create_index(
            [("organisation_id", ASCENDING), ("workspace_id", ASCENDING), ("user_id", ASCENDING)],
            unique=True
        )

        # 4. brand_workspaces
        await db.brand_workspaces.create_index(
            [("organisation_id", ASCENDING), ("workspace_id", ASCENDING)],
            unique=True
        )

        # 5. roles_permissions
        await db.roles_permissions.create_index(
            [("organisation_id", ASCENDING), ("role_name", ASCENDING)],
            unique=True
        )

        # 6. brand_guidelines
        await db.brand_guidelines.create_index(
            [("organisation_id", ASCENDING), ("workspace_id", ASCENDING), ("guideline_id", ASCENDING)],
            unique=True
        )
        await db.brand_guidelines.create_index([("organisation_id", ASCENDING), ("category", ASCENDING)])
        await db.brand_guidelines.create_index([("organisation_id", ASCENDING), ("status", ASCENDING)])

        # 7. guideline_versions
        await db.guideline_versions.create_index([("organisation_id", ASCENDING), ("guideline_id", ASCENDING), ("version_number", ASCENDING)])

        # 8. approved_facts
        await db.approved_facts.create_index(
            [("organisation_id", ASCENDING), ("workspace_id", ASCENDING), ("fact_id", ASCENDING)],
            unique=True
        )
        await db.approved_facts.create_index([("organisation_id", ASCENDING), ("category", ASCENDING)])

        # 9. fact_sources
        await db.fact_sources.create_index([("organisation_id", ASCENDING), ("source_id", ASCENDING)], unique=True)
        await db.fact_sources.create_index([("organisation_id", ASCENDING), ("fact_id", ASCENDING)])

        # 10. terminology
        await db.terminology.create_index([("organisation_id", ASCENDING), ("workspace_id", ASCENDING), ("term_text", ASCENDING)])

        # 11. brand_assets
        await db.brand_assets.create_index([("organisation_id", ASCENDING), ("workspace_id", ASCENDING), ("asset_id", ASCENDING)], unique=True)

        # 12. campaigns
        await db.campaigns.create_index([("organisation_id", ASCENDING), ("workspace_id", ASCENDING), ("campaign_id", ASCENDING)], unique=True)
        await db.campaigns.create_index([("organisation_id", ASCENDING), ("status", ASCENDING)])

        # 13. content_assets
        await db.content_assets.create_index([("organisation_id", ASCENDING), ("workspace_id", ASCENDING), ("asset_id", ASCENDING)], unique=True)
        await db.content_assets.create_index([("organisation_id", ASCENDING), ("campaign_id", ASCENDING)])
        await db.content_assets.create_index([("organisation_id", ASCENDING), ("status", ASCENDING)])

        # 14. content_versions
        await db.content_versions.create_index([("organisation_id", ASCENDING), ("asset_id", ASCENDING), ("version_label", ASCENDING)])

        # 15. graph_nodes
        await db.graph_nodes.create_index([("organisation_id", ASCENDING), ("workspace_id", ASCENDING), ("node_id", ASCENDING)], unique=True)
        await db.graph_nodes.create_index([("organisation_id", ASCENDING), ("node_type", ASCENDING)])

        # 16. graph_relationships
        await db.graph_relationships.create_index([("organisation_id", ASCENDING), ("source_node_id", ASCENDING)])
        await db.graph_relationships.create_index([("organisation_id", ASCENDING), ("target_node_id", ASCENDING)])
        await db.graph_relationships.create_index([("organisation_id", ASCENDING), ("relationship_type", ASCENDING)])

        # 17. inspection_jobs
        await db.inspection_jobs.create_index([("organisation_id", ASCENDING), ("job_id", ASCENDING)], unique=True)
        await db.inspection_jobs.create_index([("organisation_id", ASCENDING), ("asset_id", ASCENDING)])

        # 18. inspection_findings
        await db.inspection_findings.create_index([("organisation_id", ASCENDING), ("job_id", ASCENDING)])
        await db.inspection_findings.create_index([("organisation_id", ASCENDING), ("asset_id", ASCENDING)])
        await db.inspection_findings.create_index([("organisation_id", ASCENDING), ("severity", ASCENDING)])

        # 19. evidence_references
        await db.evidence_references.create_index([("organisation_id", ASCENDING), ("finding_id", ASCENDING)])

        # 20. suggested_corrections
        await db.suggested_corrections.create_index([("organisation_id", ASCENDING), ("finding_id", ASCENDING)])

        # 21. review_assignments
        await db.review_assignments.create_index([("organisation_id", ASCENDING), ("assignment_id", ASCENDING)], unique=True)
        await db.review_assignments.create_index([("organisation_id", ASCENDING), ("assigned_reviewer_id", ASCENDING), ("is_completed", ASCENDING)])

        # 22. comments
        await db.comments.create_index([("organisation_id", ASCENDING), ("asset_id", ASCENDING), ("created_at", ASCENDING)])

        # 23. approval_decisions
        await db.approval_decisions.create_index([("organisation_id", ASCENDING), ("decision_id", ASCENDING)], unique=True)
        await db.approval_decisions.create_index([("organisation_id", ASCENDING), ("asset_id", ASCENDING)])

        # 24. change_simulations
        await db.change_simulations.create_index([("organisation_id", ASCENDING), ("simulation_id", ASCENDING)], unique=True)

        # 25. impact_reports
        await db.impact_reports.create_index([("organisation_id", ASCENDING), ("simulation_id", ASCENDING)])

        # 26. audit_events
        await db.audit_events.create_index([("organisation_id", ASCENDING), ("event_id", ASCENDING)], unique=True)
        await db.audit_events.create_index([("organisation_id", ASCENDING), ("resource_id", ASCENDING)])
        await db.audit_events.create_index([("organisation_id", ASCENDING), ("created_at", DESCENDING)])

        # 27. notifications
        await db.notifications.create_index([("organisation_id", ASCENDING), ("recipient_user_id", ASCENDING), ("is_read", ASCENDING)])

        logger.info("Successfully established indexes for all 27 Phase 5 MongoDB Atlas collections.")
    except Exception as e:
        logger.warning(f"Error ensuring Phase 5 indexes: {e}")
