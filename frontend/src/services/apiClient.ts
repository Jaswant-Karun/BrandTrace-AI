/**
 * BRANDTRACE AI — Centralized Enterprise API Client
 * Automatically injects JWT Bearer tokens, normalizes error handling,
 * and enforces tenant-aware requests to the FastAPI backend.
 */

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || '';

export interface ApiError {
  message: string;
  status: number;
  detail?: any;
}

class ApiClient {
  private inFlightRequests: Map<string, Promise<any>> = new Map();
  private queryCache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly DEFAULT_CACHE_TTL_MS = 5000;

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('brandtrace_jwt_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  public clearCache(): void {
    this.queryCache.clear();
    this.inFlightRequests.clear();
  }

  async request<T>(endpoint: string, options: RequestInit & { ttlMs?: number; skipCache?: boolean } = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    
    // Invalidate query cache upon any write mutation to ensure immediate data consistency
    if (method !== 'GET') {
      this.queryCache.clear();
    }

    const headers: Record<string, string> = {
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string> || {}),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const cacheKey = `${method}:${url}:${headers['Authorization'] || 'anon'}`;

    // Return cached response if valid and not explicitly skipped
    if (method === 'GET' && !options.skipCache) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.data as T;
      }

      // In-flight request deduplication: avoid firing duplicate parallel network calls
      if (this.inFlightRequests.has(cacheKey)) {
        return this.inFlightRequests.get(cacheKey) as Promise<T>;
      }
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
          let errorData: any = {};
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText };
          }
          
          // Handle 401 Session Expiry
          if (response.status === 401) {
            localStorage.removeItem('brandtrace_jwt_token');
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('brandtrace_session_expired', {
                detail: { message: errorData.detail || 'Session expired or invalid credentials. Please log in again.' }
              }));
            }
          }

          const error: ApiError = {
            message: errorData.detail || errorData.message || `Request failed with status ${response.status}`,
            status: response.status,
            detail: errorData
          };
          throw error;
        }

        const data = await response.json() as T;

        // Populate short-lived cache for idempotent GET queries
        if (method === 'GET' && !options.skipCache) {
          const ttl = options.ttlMs ?? this.DEFAULT_CACHE_TTL_MS;
          this.queryCache.set(cacheKey, { data, expiry: Date.now() + ttl });
        }

        return data;
      } catch (err: any) {
        if (err.status) {
          throw err;
        }
        throw {
          message: err.message || 'Service unreachable. Please ensure the backend control plane is online.',
          status: 0
        } as ApiError;
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    if (method === 'GET' && !options.skipCache) {
      this.inFlightRequests.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  }

  // Domain API Endpoints
  public auth = {
    login: (credentials: { email: string; password?: string }) =>
      this.request<{ access_token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: credentials.email, password: credentials.password || 'brandtrace2026' })
      }),
    register: (data: {
      name: string;
      email: string;
      password: string;
      organisation_name?: string;
      role?: string;
      workspace_id?: string;
    }) =>
      this.request<{ access_token: string; user: any }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    me: () => this.request<any>('/api/auth/me'),
    personas: () => this.request<any[]>('/api/auth/personas'),
  };

  public organizations = {
    list: () => this.request<any[]>('/api/organizations'),
    get: (orgId: string) => this.request<any>(`/api/organizations/${orgId}`),
  };

  public knowledgeBase = {
    vectorSearch: (query: { query_text: string; org_id: string; workspace_id: string; limit?: number }) =>
      this.request<any[]>('/api/knowledge-base/vector-search', {
        method: 'POST',
        body: JSON.stringify(query)
      }),
    getAtlasIndexConfig: () => this.request<any>('/api/knowledge-base/atlas-index-config'),
    seedEmbeddings: (orgId: string, workspaceId: string) =>
      this.request<any>('/api/knowledge-base/seed-embeddings', {
        method: 'POST',
        body: JSON.stringify({ org_id: orgId, workspace_id: workspaceId })
      }),
    createFact: (data: {
      fact_id?: string;
      workspace_id: string;
      org_id?: string;
      name: string;
      category: string;
      current_value: string;
      unit?: string;
      description: string;
      source_citation: string;
      department_owner: string;
    }) =>
      this.request<any>('/api/knowledge-base/facts', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    listFacts: (workspaceId?: string) =>
      this.request<any[]>(`/api/knowledge-base/facts${workspaceId ? `?workspace_id=${workspaceId}` : ''}`),
  };

  public graph = {
    getRelationships: (orgId: string, brandId: string) =>
      this.request<any[]>(`/api/graph-intelligence/relationships?org_id=${orgId}&brand_id=${brandId}`),
    traverseDependencies: (orgId: string, rootNodeId: string, maxDepth: number = 5) =>
      this.request<any>('/api/graph-intelligence/traverse-dependencies', {
        method: 'POST',
        body: JSON.stringify({ org_id: orgId, root_node_id: rootNodeId, max_depth: maxDepth })
      }),
  };

  public approvals = {
    resolveAtomic: (payload: { task_id: string; decision: string; reviewer_name: string; reviewer_role: string; final_content?: string }) =>
      this.request<any>('/api/approvals/resolve-atomic', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    listTasks: (brandId?: string) =>
      this.request<any[]>(`/api/approvals/tasks${brandId ? `?brand_id=${brandId}` : ''}`),
  };

  public content = {
    uploadFile: (formData: FormData) =>
      this.request<any>('/api/content/upload', {
        method: 'POST',
        body: formData
      }),
    listFiles: (orgId?: string) =>
      this.request<any[]>(`/api/content/files${orgId ? `?org_id=${orgId}` : ''}`),
  };

  public documents = {
    list: (params?: { workspace_id?: string; org_id?: string; category?: string; is_demo?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.workspace_id) q.set('workspace_id', params.workspace_id);
      if (params?.org_id) q.set('org_id', params.org_id);
      if (params?.category) q.set('category', params.category);
      if (params?.is_demo !== undefined) q.set('is_demo', String(params.is_demo));
      const qs = q.toString();
      return this.request<any[]>(`/api/documents${qs ? `?${qs}` : ''}`);
    },
    get: (docId: string) => this.request<any>(`/api/documents/${docId}`),
    create: (data: { workspace_id: string; org_id?: string; title: string; category: string; description?: string; raw_content: string }) =>
      this.request<any>('/api/documents', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (docId: string, data: { title?: string; category?: string; description?: string; raw_content?: string; change_summary?: string }) =>
      this.request<any>(`/api/documents/${docId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (docId: string) =>
      this.request<any>(`/api/documents/${docId}`, {
        method: 'DELETE'
      }),
    getVersions: (docId: string) =>
      this.request<any[]>(`/api/documents/${docId}/versions`),
    upload: (formData: FormData) =>
      this.request<any>('/api/documents/upload', {
        method: 'POST',
        body: formData
      }),
    importWebsitePreview: (data: { url: string; workspace_id: string; org_id?: string }) =>
      this.request<any>('/api/documents/import-website/preview', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    importWebsiteCommit: (data: { workspace_id: string; org_id?: string; url: string; title: string; category: string; description?: string; raw_content: string }) =>
      this.request<any>('/api/documents/import-website/commit', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
  };

  public publicVerification = {
    verifySeal: (data: { seal_code: string; brand_id?: string; content_text?: string }) =>
      this.request<any>('/api/public/verify-seal', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    verifyText: (data: { content_text: string; brand_id?: string }) =>
      this.request<any>('/api/public/verify-text', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    verifyImage: (formData: FormData) =>
      this.request<any>('/api/public/verify-image', {
        method: 'POST',
        body: formData
      }),
  };

  public demo = {
    getScenarioStatus: () => this.request<any>('/api/demo/scenario-status'),
    executeStep: (stepNumber: number, actorRole?: string, actorName?: string) =>
      this.request<any>('/api/demo/execute-step', {
        method: 'POST',
        body: JSON.stringify({ step_number: stepNumber, actor_role: actorRole, actor_name: actorName })
      }),
    reset: () =>
      this.request<any>('/api/demo/reset', {
        method: 'POST'
      }),
    listCases: () => this.request<any[]>('/api/demo/cases'),
    runCase: (caseId: string, customContent?: string) =>
      this.request<any>(`/api/demo/run-case/${caseId}`, {
        method: 'POST',
        body: JSON.stringify({ case_id: caseId, custom_content: customContent })
      }),
  };

  public health = {
    check: () => this.request<any>('/health'),
  };
}

export const apiClient = new ApiClient();
