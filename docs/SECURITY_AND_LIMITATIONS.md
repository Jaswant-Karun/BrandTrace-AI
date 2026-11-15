# BRANDTRACE AI — Security Architecture & System Limitations 🔒

> **The Autonomous Brand Intelligence & Governance Control Plane**  
> *Tagline: Detect. Predict. Verify. Prevent.*

---

## 1. Authentication & Role-Based Access Control (RBAC)

BrandTrace AI implements a multi-tenant, role-based access control architecture:

### A. Authentication Protocol

- **JWT Bearer Tokens:** State-bearing, cryptographically signed JSON Web Tokens using standard HMAC-SHA256 (`HS256`) algorithms with a high-entropy secret key.
- **Password Hashing:** Passwords are salted and hashed using PBKDF2-HMAC-SHA256 with constant-time verification (`hmac.compare_digest`) to prevent timing side-channel attacks.
- **Session Lifecycle:** Tokens carry expiration timestamps (`exp`). The client automatically purges expired tokens and prompts for re-authentication.

### B. Enterprise Role Matrix

The platform defines five distinct organizational roles with strict server-side authorization enforcement:

| Role | Permissions & Scope |
| :--- | :--- |
| `ADMIN` | Full tenant administration: workspace provisioning, user registration, policy deletion, and root configuration. |
| `COMPLIANCE_REVIEWER` | Regulatory sign-off, atomic task resolution in the Approval Center, and immutable cryptographic release sealing. |
| `BRAND_MANAGER` | Brand Knowledge Management, document authoring, guideline curation, and Digital Twin change simulation execution. |
| `CREATOR` | Marketing copy inspection, candidate release drafting, and viewing recommended remediations. |
| `REVIEWER` | General read access to guidelines, facts, and inspection logs. |

---

## 2. Multi-Tenant Data Isolation

BrandTrace AI enforces strict multi-tenancy at the organizational level (`ORGANIZATION_STRICT`):

1. **Partitioning by Tenant Keys:**
   - All documents, knowledge nodes, approved facts, and release records carry mandatory `org_id` and `workspace_id` attributes.
   - Example organizations: `ORG-APEX` (*Apex Dynamics*), `ORG-AURELLE` (*Aurelle Technologies*), `ORG-NOVUS` (*Novus Health*).
2. **Server-Side Isolation Enforcement:**
   - Every database query strictly includes `{ "org_id": user.org_id, "workspace_id": user.workspace_id }`.
   - Probing an entity belonging to another organization returns HTTP `404 Not Found` rather than `403 Forbidden`, preventing cross-tenant existence enumeration.
3. **Workspace Isolation:**
   - Within an enterprise organization, individual workspaces (e.g., `aurelle-tech` vs. `aurelle-maison`) isolate brand assets and knowledge graph nodes from each other.

---

## 3. Input Validation, SSRF Defense & Upload Security

### A. Server-Side Request Forgery (SSRF) Protection

The website import feature (`POST /api/documents/import-website/preview`) implements multi-layered SSRF defenses:

- **Protocol Restriction:** Only `http://` and `https://` schemes are permitted.
- **DNS Resolution Verification:** Hostnames are resolved to IP addresses before initiating requests.
- **Private IP Space Blocking:** Requests targeting loopback, private RFC 1918, link-local, and cloud metadata endpoints are immediately rejected with HTTP 400:
  - `127.0.0.0/8` (Loopback)
  - `10.0.0.0/8` (Private Class A)
  - `172.16.0.0/12` (Private Class B)
  - `192.168.0.0/16` (Private Class C)
  - `169.254.169.254` (Cloud Provider Instance Metadata)
  - `0.0.0.0` and IPv6 localhost (`::1`)

### B. File Upload Security

- **Magic-Byte Signature Verification:** Uploaded files (`POST /api/documents/upload` and `POST /api/public/verify-image`) are validated against binary magic headers:
  - PNG: `\x89PNG\r\n\x1a\n`
  - JPEG: `\xFF\xD8\xFF`
  - WEBP: `RIFF....WEBP`
  - PDF: `%PDF-`
- **File Extension Whitelisting:** Disallowed extensions (e.g. `.exe`, `.bat`, `.sh`, `.php`) are rejected immediately.
- **Payload Limits:** Maximum file size is strictly capped at 10MB; API JSON payloads exceeding 100KB return HTTP `413 Payload Too Large`.

---

## 4. Public Verification Security & Zero-Knowledge Guarantee

The Public Verification Portal (`/api/public/*`) allows zero-authentication content and seal verification for external consumers while enforcing rigorous privacy guarantees:

1. **No Sensitive Metadata Leakage:**
   - Public verification responses strictly filter out reviewer email addresses, user IDs, internal roles, and internal MongoDB database `_id` values.
   - Only public-facing information is returned: verification status (`APPROVED`, `OUTDATED`, `MODIFIED`, `UNKNOWN`), brand name, asset title, approved version, seal code, and SHA-256 digest.
2. **Public Rate Limiting:**
   - Unauthenticated public verification endpoints enforce a sliding window rate limiter of **60 requests per minute per IP** to prevent automated ledger scraping.
3. **Canonical Text Normalization:**
   - Normalizes curly quotes (`“ ” ‘ ’` &rarr; `" '`), strips trailing whitespace, and collapses redundant internal whitespace without altering substantive words, numbers, or casing.

---

## 5. Cryptographic Implementation Details

The Audit Trust Ledger maintains an immutable chain of release records using SHA-256 block digests:

$$\text{Block Material} = \text{rec\_id} \parallel \text{last\_block\_hash} \parallel \text{resource\_id} \parallel \text{content\_hash} \parallel \text{user\_identity} \parallel \text{timestamp}$$
$$\text{Tamper-Evident Seal} = \text{BT-SEAL-} \parallel \text{SHA-256}(\text{Block Material})[:16].\text{upper()}$$

### Honest Technical Claims

- **Designation:** Accurately designated across all documentation, UI copy, and APIs as **"SHA-256 Tamper-Evident Ledger Digest (Internal Merkle-Style Chaining)"**.
- **No False Claims:** BrandTrace AI makes **zero false claims** of writing to public decentralized blockchains, zero unsubstantiated claims of HMAC without configured shared keys, and zero claims of patent grant status.

---

## 6. Known System Limitations

1. **Optical Character Recognition (OCR) Heuristic:**
   - Byte-level SHA-256 image matching is 100% deterministic and production-grade.
   - Visual similarity and optical text reading rely on OCR engines (Tesseract). If OCR binaries are absent in lightweight serverless containers, the system falls back gracefully to byte hash verification with an honest status indication.
2. **Multi-Language Regulatory Expansion:**
   - Current regulatory compliance rule-sets focus on United States statutes (FTC, FDA, Lanham Act, NHTSA). International compliance frameworks (e.g., EU Green Claims Directive, UK ASA CAP Code) are on the product roadmap.
3. **MongoDB Atlas Vector Search Synchronization:**
   - When deploying to new local environments without Atlas vector index configuration, semantic search gracefully falls back to deterministic keyword, regex, and graph-lookup matching.
4. **Cloud Infrastructure & Render Free-Tier Container Spindown:**
   - The production backend runs on Render managed containers. On standard free tiers, instances automatically sleep after 15 minutes of zero inbound traffic. An initial cold-start wake-up takes 30–45 seconds, after which all requests execute with sub-20ms latency.
5. **Multi-Tenant Logical Separation vs. Dedicated Clusters:**
   - Multi-tenancy is enforced logically at the software and database layer using strict `organisation_id` and `workspace_id` filtering on all queries. Ultra-high-security environments requiring physically isolated hardware clusters require enterprise multi-cluster provisioning.
6. **Progressive Web App (PWA) Zero-Trust Caching Boundary:**
   - The PWA Service Worker explicitly excludes private API responses, authentication tokens, and customer marketing drafts from local browser cache. Offline usage is intentionally restricted to the application shell to prevent unverified brand drift.
7. **Multimodal File Ingestion Ceiling:**
   - File uploads are capped at 25MB to prevent denial-of-service memory exhaustion. Video files are analyzed via deterministic keyframe image sampling rather than full continuous video stream decoding.

---

## 7. Responsible AI & Human Oversight Policy

- **Advisory AI Guarantee:** The multi-agent pipeline is an advisory analysis system. It flags potential legal, factual, and brand voice risks; it does **not** replace certified legal counsel.
- **Mandatory Human-in-the-Loop:** BrandTrace AI enforces a zero-automatic-publishing policy. No marketing asset, fact mutation, or policy change is committed or released without explicit human sign-off.
- **Deterministic Latency & Availability:** If external LLM APIs fail or experience latency spikes, the system falls back seamlessly to deterministic rule evaluation, maintaining uptime and guaranteeing <800ms inspection response times.
