const API_BASE = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('cipherops_token');
    const demoRole = localStorage.getItem('cipherops_demo_role') || 'INVESTIGATOR';

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['X-Demo-Role'] = demoRole;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };

    // Handle FormData
    if (options.body instanceof FormData) {
      delete (headers as any)['Content-Type'];
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMsg = errorJson.error;
      } catch (e) {
        // use default
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Auth
  public getDemoUsers() {
    return this.request<{ users: any[] }>('/auth/demo-users');
  }

  public login(credentials: { identifier?: string; password?: string; role?: string }) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  public getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  public logout() {
    return this.request<any>('/auth/logout', { method: 'POST' });
  }

  // Dashboard
  public getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  // Cases
  public getCases(params?: { status?: string; priority?: string; search?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<{ cases: any[]; count: number }>(`/cases${qs ? `?${qs}` : ''}`);
  }

  public getFirRegistry() {
    return this.request<{ firRecords: any[]; count: number }>('/cases/fir-registry');
  }

  public getCaseById(id: string) {
    return this.request<{ case: any }>(`/cases/${id}`);
  }

  public createCase(data: any) {
    return this.request<any>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public updateCase(id: string, data: any) {
    return this.request<any>(`/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public addTimelineEvent(caseId: string, eventData: any) {
    return this.request<any>(`/cases/${caseId}`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Persons
  public getPersons(params?: { role?: string; status?: string; search?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<{ persons: any[]; count: number }>(`/persons${qs ? `?${qs}` : ''}`);
  }

  public getPersonById(id: string) {
    return this.request<{ person: any }>(`/persons/${id}`);
  }

  public createPerson(data: any) {
    return this.request<any>('/persons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public updatePerson(id: string, data: any) {
    return this.request<any>(`/persons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public linkPersonToCase(personId: string, data: { caseId: string; legalRole: string; chargesOrAllegations?: string }) {
    return this.request<any>(`/persons/${personId}/link-case`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Incidents & Map
  public getIncidents(params?: { category?: string; severity?: string; caseId?: string; search?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<{ incidents: any[]; count: number }>(`/incidents${qs ? `?${qs}` : ''}`);
  }

  public createIncident(data: any) {
    return this.request<any>('/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public getLocations() {
    return this.request<{ locations: any[]; count: number }>('/incidents/locations');
  }

  public getMapIncidents(params?: { lat?: number; lng?: number; radiusKm?: number; category?: string; startDate?: string; endDate?: string }) {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') cleanParams[k] = String(v);
      });
    }
    const qs = new URLSearchParams(cleanParams).toString();
    return this.request<any>(`/map/incidents${qs ? `?${qs}` : ''}`);
  }

  public getMapSummary() {
    return this.request<any>('/map/summary');
  }

  // Evidence
  public getEvidence(params?: { caseId?: string; category?: string; status?: string; search?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<{ evidence: any[]; count: number }>(`/evidence${qs ? `?${qs}` : ''}`);
  }

  public getEvidenceById(id: string) {
    return this.request<{ evidence: any }>(`/evidence/${id}`);
  }

  public createEvidence(data: any) {
    return this.request<any>('/evidence', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public transferCustody(evidenceId: string, data: { newCustodianName: string; reason: string; location: string; authorization?: string }) {
    return this.request<any>(`/evidence/${evidenceId}/custody-events`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Documents
  public getDocuments(params?: { caseId?: string; documentType?: string; search?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<{ documents: any[]; count: number }>(`/documents${qs ? `?${qs}` : ''}`);
  }

  public getDocumentById(id: string) {
    return this.request<{ document: any }>(`/documents/${id}`);
  }

  public uploadDocument(formData: FormData) {
    return this.request<any>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // AI
  public askAi(prompt: string, caseId?: string) {
    return this.request<any>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ prompt, caseId }),
    });
  }

  public searchAi(query: string, documentType?: string, caseId?: string) {
    return this.request<{ query: string; totalMatches: number; results: any[] }>('/ai/search', {
      method: 'POST',
      body: JSON.stringify({ query, documentType, caseId }),
    });
  }

  public getCaseSummaryAi(caseId: string) {
    return this.request<any>('/ai/case-summary', {
      method: 'POST',
      body: JSON.stringify({ caseId }),
    });
  }

  public getAiSuggestedRelationships(caseId?: string) {
    return this.request<{ suggestions: any[] }>('/ai/suggest-relationships', {
      method: 'POST',
      body: JSON.stringify({ caseId }),
    });
  }

  // Graph
  public getGraphData(params?: { caseId?: string; relationshipType?: string; verifiedOnly?: boolean }) {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) cleanParams[k] = String(v);
      });
    }
    const qs = new URLSearchParams(cleanParams).toString();
    return this.request<{ nodes: any[]; edges: any[] }>(`/graph/network${qs ? `?${qs}` : ''}`);
  }

  public createRelationship(data: any) {
    return this.request<any>('/graph/relationships', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public verifyRelationship(id: string, approved: boolean) {
    return this.request<any>(`/graph/relationships/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ approved }),
    });
  }

  // Reports
  public generateReport(data: { reportType: string; caseId?: string; format?: string }) {
    return this.request<any>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public getReportHistory() {
    return this.request<{ history: any[] }>('/reports/history');
  }

  // Tasks
  public getTasks(params?: { caseId?: string; status?: string; priority?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<{ tasks: any[]; count: number }>(`/tasks${qs ? `?${qs}` : ''}`);
  }

  public createTask(data: any) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public updateTask(id: string, data: any) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Notifications
  public getNotifications() {
    return this.request<{ notifications: any[]; unreadCount: number }>('/notifications');
  }

  public markNotificationRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  public markAllNotificationsRead() {
    return this.request<any>('/notifications/mark-all-read', { method: 'POST' });
  }

  // Audit
  public getAuditEvents(params?: { action?: string; userBadge?: string; search?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<{ events: any[]; totalCount: number; isChainValid: boolean; ledgerIntegrityStatus: string }>(
      `/audit/events${qs ? `?${qs}` : ''}`
    );
  }

  // Data Quality
  public getDataQualityMetrics() {
    return this.request<any>('/data-quality/metrics');
  }

  public reviewDuplicateCandidate(data: any) {
    return this.request<any>('/data-quality/review-duplicate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin & Entities
  public getAdminUsers() {
    return this.request<{ users: any[]; count: number }>('/admin/users');
  }

  public updateUserRole(id: string, role: string) {
    return this.request<any>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  public resetDemoData() {
    return this.request<any>('/admin/system/reset-demo', { method: 'POST' });
  }

  public getVehicles(search?: string) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<{ vehicles: any[]; count: number }>(`/entities/vehicles${qs}`);
  }

  public getOrganizations(search?: string) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<{ organizations: any[]; count: number }>(`/entities/organizations${qs}`);
  }

  public getCourtProceedings(caseId?: string) {
    const qs = caseId ? `?caseId=${encodeURIComponent(caseId)}` : '';
    return this.request<{ courtProceedings: any[]; count: number }>(`/entities/court-proceedings${qs}`);
  }
}

export const api = new ApiClient();
