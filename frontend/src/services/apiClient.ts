/**
 * BRANDTRACE AI — Centralized Enterprise API Client
 * Automatically injects JWT Bearer tokens, normalizes error handling,
 * and enforces tenant-aware requests to the FastAPI backend.
 */

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

export interface ApiError {
  message: string;
  status: number;
  detail?: any;
}

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('brandtrace_jwt_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string> || {}),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        const error: ApiError = {
          message: errorData.detail || errorData.message || 'Request failed',
          status: response.status,
          detail: errorData
        };
        throw error;
      }

      return await response.json() as T;
    } catch (err: any) {
      if (err.status) {
        throw err;
      }
      throw {
        message: err.message || 'Network communication error with BrandTrace API',
        status: 0
      } as ApiError;
    }
  }

  // Domain API Endpoints
  public auth = {
    login: (credentials: { email: string; password?: string }) =>
      this.request<{ access_token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: credentials.email, password: credentials.password || 'brandtrace2026' })
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
