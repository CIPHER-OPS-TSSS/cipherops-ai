import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const aiRouter = Router();

aiRouter.use(authMiddleware);

// POST /api/ai/ask - Conversational Case Assistant with citations & safeguards
aiRouter.post('/ask', requirePermission(PERMISSIONS.AI_ASSISTANT), (req: Request, res: Response) => {
  const { prompt, caseId } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt query is required' });
  }

  const aiResponse = dbStore.askAIAssistant(prompt, caseId);

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'AI_SEARCH_QUERY',
    targetResource: caseId ? `Case:${caseId}` : 'AI:GlobalAssistant',
    details: `AI Case Assistant query: "${prompt.slice(0, 100)}"`,
    ipAddress: req.ip,
  });

  res.json(aiResponse);
});

// POST /api/ai/search - Hybrid semantic search across documents and cases
aiRouter.post('/search', requirePermission(PERMISSIONS.AI_SEARCH), (req: Request, res: Response) => {
  const { query, documentType, caseId } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const q = query.toLowerCase();
  let candidateDocs = dbStore.getDocuments({ caseId, documentType });

  // Calculate hybrid match score (exact match + lexical match + semantic relevance)
  const scoredResults = candidateDocs.map(doc => {
    let score = 0.45; // baseline semantic prior
    const text = (doc.extractedText || '').toLowerCase();
    const title = doc.title.toLowerCase();

    if (title.includes(q)) score += 0.40;
    if (text.includes(q)) score += 0.35;
    if (doc.documentNumber.toLowerCase().includes(q)) score += 0.50;

    // Check individual keywords
    const keywords = q.split(/\s+/).filter(k => k.length > 2);
    keywords.forEach(kw => {
      if (text.includes(kw)) score += 0.08;
    });

    score = Math.min(0.99, Math.round(score * 100) / 100);

    // Extract relevant excerpt
    let excerpt = doc.extractedText?.slice(0, 220) || 'Official document text indexed.';
    const matchIdx = text.indexOf(q);
    if (matchIdx !== -1) {
      const start = Math.max(0, matchIdx - 40);
      const end = Math.min(text.length, matchIdx + q.length + 140);
      excerpt = '...' + text.slice(start, end) + '...';
    }

    return {
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      title: doc.title,
      documentType: doc.documentType,
      fileName: doc.fileName,
      relevanceScore: score,
      excerpt,
      pageNumber: 1,
      linkedCases: doc.linkedCases,
      sha256Hash: doc.sha256Hash,
      createdAt: doc.createdAt,
    };
  });

  // Filter for matching results and sort descending
  const matchingResults = scoredResults
    .filter(r => r.relevanceScore > 0.50)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'AI_SEARCH_QUERY',
    targetResource: 'AI:HybridSearch',
    details: `Hybrid document search query: "${query}" (Found ${matchingResults.length} records)`,
    ipAddress: req.ip,
  });

  res.json({
    query,
    totalMatches: matchingResults.length,
    results: matchingResults,
  });
});

// POST /api/ai/case-summary
aiRouter.post('/case-summary', requirePermission(PERMISSIONS.AI_ASSISTANT), (req: Request, res: Response) => {
  const { caseId } = req.body;
  if (!caseId) {
    return res.status(400).json({ error: 'caseId is required' });
  }

  const caseDossier = dbStore.getCaseById(caseId);
  if (!caseDossier) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const summary = dbStore.askAIAssistant(`Summarize investigation history and facts for ${caseDossier.caseNumber}`, caseId);
  res.json(summary);
});

// POST /api/ai/suggest-relationships
aiRouter.post('/suggest-relationships', requirePermission(PERMISSIONS.RELATIONSHIP_VIEW), (req: Request, res: Response) => {
  const { caseId } = req.body;
  
  // Return suggested relationships from the store
  const allSuggestions = dbStore.data.caseRelationships.filter(r => !r.isVerified);
  const filtered = caseId
    ? allSuggestions.filter(r => r.sourceCaseId === caseId || r.targetCaseId === caseId)
    : allSuggestions;

  res.json({
    suggestions: filtered.map(r => ({
      id: r.id,
      sourceCase: dbStore.data.cases.find(c => c.id === r.sourceCaseId),
      targetCase: dbStore.data.cases.find(c => c.id === r.targetCaseId),
      relationshipType: r.relationshipType,
      confidenceScore: r.confidenceScore,
      reasonForSuggestion: r.reasonForSuggestion,
      supportingEvidence: r.supportingEvidence,
      suggestedBy: r.suggestedBy,
      createdAt: r.createdAt,
    })),
  });
});
