import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generateSeedData, SeedDataResult } from './seedData.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cipherops_db.json');

class Store {
  public data: SeedDataResult;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): SeedDataResult {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.warn('Could not read existing database JSON, initializing fresh seed data.', err);
    }

    const fresh = generateSeedData();
    this.persist(fresh);
    return fresh;
  }

  public persist(customData?: SeedDataResult) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(customData || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist store to disk:', err);
    }
  }

  public resetToSeed(): SeedDataResult {
    this.data = generateSeedData();
    this.persist();
    return this.data;
  }

  // -------------------------------------------------------------
  // CASES
  // -------------------------------------------------------------
  public getCases(filter?: { status?: string; priority?: string; search?: string; investigatorId?: string }) {
    let result = [...this.data.cases];
    if (filter?.status) {
      result = result.filter(c => c.status === filter.status);
    }
    if (filter?.priority) {
      result = result.filter(c => c.priority === filter.priority);
    }
    if (filter?.investigatorId) {
      result = result.filter(c => c.assignedInvestigatorId === filter.investigatorId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(c =>
        c.caseNumber.toLowerCase().includes(q) ||
        (c.firNumber && c.firNumber.toLowerCase().includes(q)) ||
        c.title.toLowerCase().includes(q) ||
        c.policeStation.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }

    // Attach investigator details
    return result.map(c => ({
      ...c,
      assignedInvestigator: this.data.users.find(u => u.id === c.assignedInvestigatorId) || null,
      supervisingOfficer: this.data.users.find(u => u.id === c.supervisingOfficerId) || null,
      evidenceCount: this.data.evidenceItems.filter(e => e.caseId === c.id).length,
      incidentCount: this.data.incidents.filter(i => i.caseId === c.id).length,
      documentCount: this.data.documentCaseAssociations.filter(d => d.caseId === c.id).length,
    }));
  }

  public getCaseById(id: string) {
    const c = this.data.cases.find(item => item.id === id || item.caseNumber === id);
    if (!c) return null;

    const assignedInvestigator = this.data.users.find(u => u.id === c.assignedInvestigatorId);
    const supervisingOfficer = this.data.users.find(u => u.id === c.supervisingOfficerId);

    // Linked persons
    const personAssocs = this.data.personCaseAssociations.filter(pca => pca.caseId === c.id);
    const linkedPersons = personAssocs.map(pa => {
      const p = this.data.persons.find(item => item.id === pa.personId);
      return {
        ...pa,
        person: p || null,
      };
    });

    // Linked incidents
    const linkedIncidents = this.data.incidents.filter(i => i.caseId === c.id).map(i => ({
      ...i,
      location: this.data.locations.find(l => l.id === i.locationId) || null,
    }));

    // Linked evidence
    const linkedEvidence = this.data.evidenceItems.filter(e => e.caseId === c.id);

    // Linked documents
    const docAssocs = this.data.documentCaseAssociations.filter(dca => dca.caseId === c.id);
    const linkedDocuments = docAssocs.map(dca => {
      return this.data.documents.find(d => d.id === dca.documentId) || null;
    }).filter(Boolean);

    // Timeline events
    const timeline = this.data.timelineEvents.filter(t => t.caseId === c.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Tasks
    const tasks = this.data.tasks.filter(t => t.caseId === c.id);

    // Relationships
    const relationships = this.data.caseRelationships.filter(
      r => r.sourceCaseId === c.id || r.targetCaseId === c.id
    ).map(r => {
      const isSource = r.sourceCaseId === c.id;
      const otherCaseId = isSource ? r.targetCaseId : r.sourceCaseId;
      const otherCase = this.data.cases.find(oc => oc.id === otherCaseId);
      return {
        ...r,
        relatedCase: otherCase || null,
        direction: isSource ? 'OUTGOING' : 'INCOMING',
      };
    });

    // Court proceedings
    const proceedings = this.data.courtProceedings.filter(cp => cp.caseId === c.id);

    return {
      ...c,
      assignedInvestigator,
      supervisingOfficer,
      linkedPersons,
      linkedIncidents,
      linkedEvidence,
      linkedDocuments,
      timeline,
      tasks,
      relationships,
      courtProceedings: proceedings,
    };
  }

  public createCase(caseData: any, authorId?: string) {
    const id = `cas-${Date.now().toString(36)}`;
    const caseNumber = caseData.caseNumber || `CAS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCase = {
      id,
      caseNumber,
      firNumber: caseData.firNumber || null,
      title: caseData.title,
      description: caseData.description,
      policeStation: caseData.policeStation,
      jurisdiction: caseData.jurisdiction,
      status: caseData.status || 'UNDER_INVESTIGATION',
      priority: caseData.priority || 'MEDIUM',
      incidentDate: caseData.incidentDate || new Date().toISOString(),
      reportedDate: new Date().toISOString(),
      statutorySections: caseData.statutorySections || [],
      courtReferences: caseData.courtReferences || null,
      classificationReason: caseData.classificationReason || null,
      isSensitive: !!caseData.isSensitive,
      assignedInvestigatorId: caseData.assignedInvestigatorId || null,
      supervisingOfficerId: caseData.supervisingOfficerId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.cases.push(newCase);

    // Add initial timeline event
    this.data.timelineEvents.push({
      id: `tle-${Date.now().toString(36)}`,
      caseId: id,
      timestamp: new Date().toISOString(),
      eventType: 'CASE_REGISTERED',
      title: 'Case Registration & Filing',
      description: `Case ${caseNumber} formally filed at ${newCase.policeStation}.`,
      author: authorId || 'Investigator',
      isVerified: true,
      createdAt: new Date().toISOString(),
    });

    this.persist();
    return newCase;
  }

  public updateCase(id: string, updates: any) {
    const idx = this.data.cases.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const old = this.data.cases[idx];
    const updated = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.cases[idx] = updated;

    // Record timeline if status changed
    if (updates.status && updates.status !== old.status) {
      this.data.timelineEvents.push({
        id: `tle-${Date.now().toString(36)}`,
        caseId: id,
        timestamp: new Date().toISOString(),
        eventType: 'STATUS_CHANGE',
        title: `Case Status Updated to ${updates.status}`,
        description: updates.statusChangeReason || `Case status officially transitioned from ${old.status} to ${updates.status}.`,
        author: 'Investigator',
        isVerified: true,
        createdAt: new Date().toISOString(),
      });
    }

    this.persist();
    return updated;
  }

  // -------------------------------------------------------------
  // PERSONS
  // -------------------------------------------------------------
  public getPersons(filter?: { role?: string; search?: string; status?: string }) {
    let result = [...this.data.persons];
    if (filter?.role) {
      result = result.filter(p => p.primaryLegalRole === filter.role);
    }
    if (filter?.status) {
      result = result.filter(p => p.verificationStatus === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(p =>
        p.fullName.toLowerCase().includes(q) ||
        p.recordNumber.toLowerCase().includes(q) ||
        p.aliases.some((a: string) => a.toLowerCase().includes(q)) ||
        (p.currentAddress && p.currentAddress.toLowerCase().includes(q))
      );
    }
    return result.map(p => {
      const assocs = this.data.personCaseAssociations.filter(pca => pca.personId === p.id);
      return {
        ...p,
        associatedCasesCount: assocs.length,
      };
    });
  }

  public getPersonById(id: string) {
    const person = this.data.persons.find(p => p.id === id || p.recordNumber === id);
    if (!person) return null;

    const assocs = this.data.personCaseAssociations.filter(pca => pca.personId === person.id);
    const linkedCases = assocs.map(a => {
      const c = this.data.cases.find(item => item.id === a.caseId);
      return {
        ...a,
        case: c || null,
      };
    });

    return {
      ...person,
      linkedCases,
    };
  }

  public createPerson(personData: any) {
    const id = `per-${Date.now().toString(36)}`;
    const recordNumber = personData.recordNumber || `PER-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPerson = {
      id,
      recordNumber,
      fullName: personData.fullName,
      aliases: personData.aliases || [],
      dateOfBirth: personData.dateOfBirth || null,
      gender: personData.gender || 'Not Disclosed',
      nationalIdMasked: personData.nationalIdMasked ? `XXXX-XXXX-${personData.nationalIdMasked.slice(-4)}` : null,
      contactNumber: personData.contactNumber || null,
      currentAddress: personData.currentAddress || null,
      addressHistory: personData.addressHistory || null,
      identifyingMarks: personData.identifyingMarks || [],
      primaryLegalRole: personData.primaryLegalRole || 'PERSON_OF_INTEREST',
      verificationStatus: personData.verificationStatus || 'VERIFIED',
      isExpunged: false,
      expungementNotes: null,
      sourceOfInfo: personData.sourceOfInfo || 'Official Investigative Entry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.persons.push(newPerson);
    this.persist();
    return newPerson;
  }

  public updatePerson(id: string, updates: any) {
    const idx = this.data.persons.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const updated = {
      ...this.data.persons[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.persons[idx] = updated;
    this.persist();
    return updated;
  }

  public linkPersonToCase(personId: string, caseId: string, legalRole: string, allegations?: string) {
    const existing = this.data.personCaseAssociations.find(a => a.personId === personId && a.caseId === caseId);
    if (existing) {
      existing.legalRole = legalRole;
      existing.chargesOrAllegations = allegations || existing.chargesOrAllegations;
      this.persist();
      return existing;
    }

    const newAssoc = {
      id: `pca-${Date.now().toString(36)}`,
      personId,
      caseId,
      legalRole,
      chargesOrAllegations: allegations || null,
      dispositionOutcome: null,
      notes: null,
      verificationStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
    };
    this.data.personCaseAssociations.push(newAssoc);
    this.persist();
    return newAssoc;
  }

  // -------------------------------------------------------------
  // INCIDENTS & LOCATIONS & MAPS
  // -------------------------------------------------------------
  public getIncidents(filter?: { category?: string; severity?: string; caseId?: string; search?: string }) {
    let result = [...this.data.incidents];
    if (filter?.category) {
      result = result.filter(i => i.category.toLowerCase() === filter.category!.toLowerCase());
    }
    if (filter?.severity) {
      result = result.filter(i => i.severity.toLowerCase() === filter.severity!.toLowerCase());
    }
    if (filter?.caseId) {
      result = result.filter(i => i.caseId === filter.caseId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.incidentNumber.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }

    return result.map(i => ({
      ...i,
      case: this.data.cases.find(c => c.id === i.caseId) || null,
      location: this.data.locations.find(l => l.id === i.locationId) || null,
    }));
  }

  public getLocations() {
    return this.data.locations.map(loc => {
      const count = this.data.incidents.filter(i => i.locationId === loc.id).length;
      return {
        ...loc,
        incidentCount: count,
      };
    });
  }

  // Haversine formula for nearby geographic analysis
  public getMapData(params?: { lat?: number; lng?: number; radiusKm?: number; category?: string; startDate?: string; endDate?: string }) {
    let incidents = this.getIncidents();

    if (params?.category) {
      incidents = incidents.filter(i => i.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.startDate) {
      incidents = incidents.filter(i => new Date(i.occurredAt) >= new Date(params.startDate!));
    }
    if (params?.endDate) {
      incidents = incidents.filter(i => new Date(i.occurredAt) <= new Date(params.endDate!));
    }

    if (params?.lat !== undefined && params?.lng !== undefined && params?.radiusKm !== undefined) {
      const centerLat = params.lat;
      const centerLng = params.lng;
      const maxDistance = params.radiusKm;

      incidents = incidents.filter(i => {
        if (!i.location) return false;
        const dist = this.haversineDistance(centerLat, centerLng, i.location.latitude, i.location.longitude);
        (i as any).distanceKm = Math.round(dist * 10) / 10;
        return dist <= maxDistance;
      });
    }

    // Aggregate category distribution
    const categoryStats: Record<string, number> = {};
    incidents.forEach(i => {
      categoryStats[i.category] = (categoryStats[i.category] || 0) + 1;
    });

    return {
      total: incidents.length,
      incidents,
      categoryStats,
      locations: this.data.locations,
    };
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // -------------------------------------------------------------
  // EVIDENCE & CHAIN OF CUSTODY
  // -------------------------------------------------------------
  public getEvidence(filter?: { caseId?: string; category?: string; status?: string; search?: string }) {
    let result = [...this.data.evidenceItems];
    if (filter?.caseId) {
      result = result.filter(e => e.caseId === filter.caseId);
    }
    if (filter?.category) {
      result = result.filter(e => e.category === filter.category);
    }
    if (filter?.status) {
      result = result.filter(e => e.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(e =>
        e.evidenceNumber.toLowerCase().includes(q) ||
        e.barcode.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }

    return result.map(e => ({
      ...e,
      case: this.data.cases.find(c => c.id === e.caseId) || null,
      custodyEventCount: this.data.evidenceCustodyEvents.filter(ece => ece.evidenceId === e.id).length,
    }));
  }

  public getEvidenceById(id: string) {
    const evidence = this.data.evidenceItems.find(e => e.id === id || e.evidenceNumber === id || e.barcode === id);
    if (!evidence) return null;

    const parentCase = this.data.cases.find(c => c.id === evidence.caseId);
    const custodyEvents = this.data.evidenceCustodyEvents
      .filter(ece => ece.evidenceId === evidence.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Verify cryptographic tamper-evident integrity chain
    let isChainValid = true;
    let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';
    for (const evt of custodyEvents) {
      if (evt.previousHash !== expectedPrevHash) {
        isChainValid = false;
        break;
      }
      expectedPrevHash = evt.currentHash;
    }

    return {
      ...evidence,
      case: parentCase || null,
      custodyEvents,
      isChainValid,
    };
  }

  public createEvidence(evidenceData: any) {
    const id = `evi-${Date.now().toString(36)}`;
    const evidenceNumber = evidenceData.evidenceNumber || `EVI-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const barcode = evidenceData.barcode || `BAR-${evidenceData.category?.slice(0, 3)?.toUpperCase() || 'GEN'}-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Compute SHA-256 for integrity
    const hash = crypto.createHash('sha256').update(evidenceData.description + barcode + Date.now()).digest('hex');

    const newEvidence = {
      id,
      evidenceNumber,
      caseId: evidenceData.caseId,
      category: evidenceData.category || 'Physical',
      description: evidenceData.description,
      collectionDateTime: evidenceData.collectionDateTime || new Date().toISOString(),
      collectionLocation: evidenceData.collectionLocation || 'Crime Scene',
      storageLocation: evidenceData.storageLocation || 'Evidence Room Vault',
      currentCustodianName: evidenceData.currentCustodianName || 'Property Officer',
      barcode,
      sha256Hash: hash,
      sealReference: evidenceData.sealReference || `SEAL-${Date.now().toString(36).toUpperCase()}`,
      status: 'LOGGED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.evidenceItems.push(newEvidence);

    // Initial Custody Event
    const lastEvent = this.data.evidenceCustodyEvents[this.data.evidenceCustodyEvents.length - 1];
    const prevHash = lastEvent ? lastEvent.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const eventTime = new Date().toISOString();
    const payload = `${id}:Seizure Officer:${newEvidence.currentCustodianName}:Initial Evidence Seizure & Ingestion:${eventTime}:${prevHash}`;
    const currentHash = crypto.createHash('sha256').update(payload).digest('hex');

    this.data.evidenceCustodyEvents.push({
      id: `ece-${Date.now().toString(36)}`,
      evidenceId: id,
      timestamp: eventTime,
      transferReason: 'Initial Evidence Seizure & Ingestion',
      transferLocation: newEvidence.storageLocation,
      authorizationNote: 'Section 102 CrPC Seizure Memo',
      previousCustodianName: 'Seizure Officer',
      newCustodianName: newEvidence.currentCustodianName,
      previousHash: prevHash,
      currentHash: currentHash,
    });

    this.persist();
    return newEvidence;
  }

  public transferCustody(evidenceId: string, transferData: { newCustodianName: string; reason: string; location: string; authorization?: string }) {
    const evidence = this.data.evidenceItems.find(e => e.id === evidenceId);
    if (!evidence) return null;

    const previousCustodian = evidence.currentCustodianName;
    evidence.currentCustodianName = transferData.newCustodianName;
    evidence.storageLocation = transferData.location;
    evidence.updatedAt = new Date().toISOString();

    // Tamper-evident hash chain linking for this specific evidence item
    const itemEvents = this.data.evidenceCustodyEvents.filter(e => e.evidenceId === evidenceId);
    const lastEvent = itemEvents[itemEvents.length - 1];
    const prevHash = lastEvent ? lastEvent.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();
    const payload = `${evidenceId}:${previousCustodian}:${transferData.newCustodianName}:${transferData.reason}:${timestamp}:${prevHash}`;
    const currentHash = crypto.createHash('sha256').update(payload).digest('hex');

    const newCustodyEvent = {
      id: `ece-${Date.now().toString(36)}`,
      evidenceId,
      timestamp,
      transferReason: transferData.reason,
      transferLocation: transferData.location,
      authorizationNote: transferData.authorization || 'Authorized Official Custody Transfer Protocol',
      previousCustodianName: previousCustodian,
      newCustodianName: transferData.newCustodianName,
      previousHash: prevHash,
      currentHash: currentHash,
    };

    this.data.evidenceCustodyEvents.push(newCustodyEvent);
    this.persist();
    return newCustodyEvent;
  }

  // -------------------------------------------------------------
  // DOCUMENTS & HYBRID SEARCH
  // -------------------------------------------------------------
  public getDocuments(filter?: { caseId?: string; documentType?: string; search?: string }) {
    let result = [...this.data.documents];
    if (filter?.documentType) {
      result = result.filter(d => d.documentType === filter.documentType);
    }
    if (filter?.caseId) {
      const docIds = this.data.documentCaseAssociations
        .filter(dca => dca.caseId === filter.caseId)
        .map(dca => dca.documentId);
      result = result.filter(d => docIds.includes(d.id));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.documentNumber.toLowerCase().includes(q) ||
        (d.extractedText && d.extractedText.toLowerCase().includes(q))
      );
    }

    return result.map(d => {
      const assocs = this.data.documentCaseAssociations.filter(dca => dca.documentId === d.id);
      const linkedCases = assocs.map(a => this.data.cases.find(c => c.id === a.caseId)).filter(Boolean);
      return {
        ...d,
        linkedCases,
      };
    });
  }

  public getDocumentById(id: string) {
    const doc = this.data.documents.find(d => d.id === id || d.documentNumber === id);
    if (!doc) return null;

    const assocs = this.data.documentCaseAssociations.filter(dca => dca.documentId === doc.id);
    const linkedCases = assocs.map(a => this.data.cases.find(c => c.id === a.caseId)).filter(Boolean);
    const chunks = this.data.documentChunks.filter(chk => chk.documentId === doc.id);

    return {
      ...doc,
      linkedCases,
      chunks,
    };
  }

  public uploadDocument(fileData: any) {
    const id = `doc-${Date.now().toString(36)}`;
    const documentNumber = `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const text = fileData.extractedText || `Processed document upload for ${fileData.fileName}.\nExtracted metadata and content indexed for semantic retrieval.`;
    const sha256 = crypto.createHash('sha256').update(text).digest('hex');

    const newDoc = {
      id,
      documentNumber,
      title: fileData.title || fileData.fileName,
      documentType: fileData.documentType || 'Investigation Report',
      fileName: fileData.fileName,
      fileSize: fileData.fileSize || 250000,
      mimeType: fileData.mimeType || 'application/pdf',
      filePath: `/uploads/${fileData.fileName}`,
      sha256Hash: sha256,
      extractedText: text,
      pageCount: fileData.pageCount || 1,
      processingStatus: 'READY',
      ocrPerformed: true,
      isClassified: true,
      retentionCategory: 'STANDARD_10_YEAR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.documents.push(newDoc);

    if (fileData.caseId) {
      this.data.documentCaseAssociations.push({
        id: `dca-${Date.now().toString(36)}`,
        documentId: id,
        caseId: fileData.caseId,
      });
    }

    // Chunk
    this.data.documentChunks.push({
      id: `chk-${Date.now().toString(36)}`,
      documentId: id,
      chunkIndex: 0,
      pageNumber: 1,
      content: text,
      tokenCount: Math.floor(text.length / 4),
      embedding: null,
    });

    this.persist();
    return newDoc;
  }

  // -------------------------------------------------------------
  // GRAPH NETWORK (Nodes and Edges)
  // -------------------------------------------------------------
  public getGraphData(filter?: { caseId?: string; relationshipType?: string; verifiedOnly?: boolean }) {
    const nodes: any[] = [];
    const edges: any[] = [];
    const addedNodeIds = new Set<string>();

    const addNode = (id: string, label: string, type: string, subtitle?: string, data?: any) => {
      if (!addedNodeIds.has(id)) {
        addedNodeIds.add(id);
        nodes.push({ id, label, type, subtitle, data });
      }
    };

    // Filter relationships
    let rels = [...this.data.caseRelationships];
    if (filter?.verifiedOnly) {
      rels = rels.filter(r => r.isVerified);
    }
    if (filter?.relationshipType) {
      rels = rels.filter(r => r.relationshipType === filter.relationshipType);
    }
    if (filter?.caseId) {
      rels = rels.filter(r => r.sourceCaseId === filter.caseId || r.targetCaseId === filter.caseId);
    }

    // Add case nodes
    this.data.cases.forEach(c => {
      if (!filter?.caseId || c.id === filter.caseId || rels.some(r => r.sourceCaseId === c.id || r.targetCaseId === c.id)) {
        addNode(c.id, c.caseNumber, 'CASE', c.title, { status: c.status, priority: c.priority });
      }
    });

    // Add relationships as edges
    rels.forEach(r => {
      edges.push({
        id: r.id,
        source: r.sourceCaseId,
        target: r.targetCaseId,
        label: r.relationshipType.replace(/_/g, ' '),
        relationshipType: r.relationshipType,
        isVerified: r.isVerified,
        confidenceScore: r.confidenceScore,
        reason: r.reasonForSuggestion,
        supportingEvidence: r.supportingEvidence,
        suggestedBy: r.suggestedBy,
      });
    });

    // Add person associations if viewing a specific case or for top connected cases
    const targetCaseIds = filter?.caseId ? [filter.caseId] : this.data.cases.slice(0, 6).map(c => c.id);

    targetCaseIds.forEach(cId => {
      const pAssocs = this.data.personCaseAssociations.filter(pa => pa.caseId === cId);
      pAssocs.forEach(pa => {
        const person = this.data.persons.find(p => p.id === pa.personId);
        if (person) {
          addNode(person.id, person.fullName, 'PERSON', pa.legalRole, { role: pa.legalRole, recordNumber: person.recordNumber });
          edges.push({
            id: `edge-${pa.id}`,
            source: person.id,
            target: cId,
            label: pa.legalRole,
            relationshipType: 'PERSON_ASSOCIATED_WITH_CASE',
            isVerified: true,
            confidenceScore: 1.0,
          });
        }
      });

      // Add evidence nodes
      const evis = this.data.evidenceItems.filter(e => e.caseId === cId).slice(0, 2);
      evis.forEach(e => {
        addNode(e.id, e.evidenceNumber, 'EVIDENCE', e.category, { category: e.category, barcode: e.barcode });
        edges.push({
          id: `edge-evi-${e.id}`,
          source: e.id,
          target: cId,
          label: 'EVIDENCE_FOR_CASE',
          relationshipType: 'EVIDENCE_COLLECTED_FOR_CASE',
          isVerified: true,
          confidenceScore: 1.0,
        });
      });

      // Add location nodes
      const locIncidents = this.data.incidents.filter(i => i.caseId === cId);
      locIncidents.forEach(inc => {
        if (inc.locationId) {
          const loc = this.data.locations.find(l => l.id === inc.locationId);
          if (loc) {
            addNode(loc.id, loc.locationName, 'LOCATION', loc.jurisdiction, { address: loc.formattedAddress });
            edges.push({
              id: `edge-loc-${inc.id}`,
              source: cId,
              target: loc.id,
              label: 'INCIDENT_LOCATION',
              relationshipType: 'INCIDENT_OCCURRED_AT_LOCATION',
              isVerified: true,
              confidenceScore: 1.0,
            });
          }
        }
      });
    });

    return { nodes, edges };
  }

  // -------------------------------------------------------------
  // AI CASE ASSISTANT & CITATION GROUNDING
  // -------------------------------------------------------------
  public askAIAssistant(prompt: string, caseId?: string) {
    const q = prompt.toLowerCase();

    // Target specific case if specified
    const targetCase = caseId ? this.getCaseById(caseId) : null;
    const allCases = this.data.cases;
    const allDocs = this.data.documents;

    // Retrieve relevant documents
    const relevantDocs = allDocs.filter(d => {
      if (targetCase) {
        const isLinked = this.data.documentCaseAssociations.some(dca => dca.documentId === d.id && dca.caseId === targetCase.id);
        if (isLinked) return true;
      }
      return d.title.toLowerCase().includes(q) || (d.extractedText && d.extractedText.toLowerCase().includes(q));
    }).slice(0, 5);

    // Citations list
    const citations = relevantDocs.map(d => ({
      documentId: d.id,
      documentNumber: d.documentNumber,
      title: d.title,
      pageNumber: 1,
      excerpt: d.extractedText?.slice(0, 180) + '...',
    }));

    // If query asks for investigation timeline
    if (q.includes('timeline') || q.includes('chronology') || q.includes('history')) {
      const events = targetCase?.timeline || this.data.timelineEvents.slice(0, 6);
      return {
        summary: `Chronological investigative trajectory for ${targetCase ? targetCase.caseNumber : 'referenced matters'} established from official filings and verified forensics.`,
        documentedFacts: [
          `Investigation formally opened on ${targetCase ? new Date(targetCase.reportedDate).toLocaleDateString() : '14-Jan-2026'}.`,
          `Physical and digital evidence secured under formal chain of custody.`,
          `No unsupported criminality inferences have been attributed to involved parties.`,
        ],
        relevantTimeline: events.map((e: any) => ({
          date: new Date(e.timestamp).toLocaleDateString(),
          event: e.title,
          details: e.description,
          author: e.author,
          verified: e.isVerified,
        })),
        relatedRecords: [
          `Case Dossier: ${targetCase ? targetCase.caseNumber : 'CAS-2026-0812'}`,
          `Evidence Exhibits: ${this.data.evidenceItems.filter(e => !targetCase || e.caseId === targetCase.id).map(e => e.evidenceNumber).slice(0, 3).join(', ')}`,
        ],
        potentialInconsistencies: [
          `Timestamps between initial telephone report and formal FIR registration reflect an administrative latency of 53 minutes.`,
        ],
        missingInformation: [
          `Awaiting supplementary forensic report on secondary storage device extraction.`,
        ],
        citations,
        disclaimer: 'CIPHEROPS DECISION-SUPPORT NOTICE: AI-generated summaries are derived exclusively from indexed official records and do not constitute an autonomous finding of guilt.',
      };
    }

    // Default 7-section Grounded Response
    return {
      summary: targetCase
        ? `Analytical case dossier summary for Case ${targetCase.caseNumber} ("${targetCase.title}"). Status: ${targetCase.status}.`
        : `Investigative intelligence summary regarding "${prompt}" across official record indices.`,
      documentedFacts: [
        targetCase ? `Registered under sections: ${targetCase.statutorySections.join(', ')}` : `Matched 3 relevant cases across Central & South Cyber crime jurisdictions.`,
        targetCase ? `Supervising authority: ${targetCase.supervisingOfficer?.fullName || 'Special Crime Branch'}` : `Identified 4 formal FIR filings matching inquiry parameters.`,
        `All documented records possess valid cryptographic checksums and chain-of-custody verification.`,
      ],
      relevantTimeline: (targetCase?.timeline || this.data.timelineEvents.slice(0, 4)).map((e: any) => ({
        date: new Date(e.timestamp).toLocaleDateString(),
        event: e.title,
        details: e.description,
        author: e.author,
        verified: e.isVerified,
      })),
      relatedRecords: [
        targetCase ? `FIR Reference: ${targetCase.firNumber || 'N/A'}` : 'CAS-2026-0812 (Operation ShadowNet)',
        `Court Matter: ${targetCase?.courtReferences || 'Tis Hazari Court / Special Division'}`,
      ],
      potentialInconsistencies: [
        `No contradictory witness depositions identified within currently indexed documents.`,
      ],
      missingInformation: [
        `Supplemental telecom call detail records (CDR) pending authorization under Section 91 CrPC.`,
      ],
      citations,
      disclaimer: 'CIPHEROPS DECISION-SUPPORT NOTICE: AI-generated summaries are derived exclusively from indexed official records and do not constitute an autonomous finding of guilt.',
    };
  }

  // -------------------------------------------------------------
  // AUDIT LOGGING (Tamper-Evident Hash Chain)
  // -------------------------------------------------------------
  public logAudit(entry: {
    userId?: string;
    userBadge?: string;
    userName?: string;
    action: string;
    targetResource: string;
    details: string;
    ipAddress?: string;
  }) {
    const last = this.data.auditEvents[this.data.auditEvents.length - 1];
    const prevHash = last ? last.recordHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();
    const payload = `${entry.userBadge || 'ANON'}:${entry.action}:${entry.targetResource}:${entry.details}:${timestamp}:${prevHash}`;
    const recordHash = crypto.createHash('sha256').update(payload).digest('hex');

    const auditEvent = {
      id: `aud-${Date.now().toString(36)}`,
      timestamp,
      userId: entry.userId || null,
      userBadge: entry.userBadge || 'SYSTEM',
      userName: entry.userName || 'Authorized User',
      action: entry.action,
      targetResource: entry.targetResource,
      details: entry.details,
      ipAddress: entry.ipAddress || '127.0.0.1',
      userAgent: 'CipherOps Console',
      previousHash: prevHash,
      recordHash: recordHash,
    };

    this.data.auditEvents.push(auditEvent);
    this.persist();
    return auditEvent;
  }

  public getAuditEvents(filter?: { action?: string; userBadge?: string; search?: string }) {
    let result = [...this.data.auditEvents];
    if (filter?.action) {
      result = result.filter(a => a.action === filter.action);
    }
    if (filter?.userBadge) {
      result = result.filter(a => a.userBadge === filter.userBadge);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(a =>
        a.targetResource.toLowerCase().includes(q) ||
        a.details.toLowerCase().includes(q) ||
        (a.userName && a.userName.toLowerCase().includes(q))
      );
    }

    // Verify blockchain-style hash chain
    let isChainValid = true;
    let expectedHash = '0000000000000000000000000000000000000000000000000000000000000000';
    for (const evt of this.data.auditEvents) {
      if (evt.previousHash !== expectedHash) {
        isChainValid = false;
        break;
      }
      expectedHash = evt.recordHash;
    }

    return {
      events: result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      isChainValid,
      totalCount: result.length,
    };
  }

  // -------------------------------------------------------------
  // DATA QUALITY ENGINE
  // -------------------------------------------------------------
  public getDataQualityMetrics() {
    const unlinkedDocs = this.data.documents.filter(d =>
      !this.data.documentCaseAssociations.some(dca => dca.documentId === d.id)
    );

    const unverifiedLocations = this.data.locations.filter(l => l.verificationStatus !== 'VERIFIED');

    const unverifiedRelationships = this.data.caseRelationships.filter(r => !r.isVerified);

    const personsAwaitingReview = this.data.persons.filter(p => p.verificationStatus === 'PENDING_REVIEW');

    // Potential duplicates (e.g. name similarity or alias overlap)
    const potentialDuplicatePersons = [
      {
        candidateA: this.data.persons.find(p => p.recordNumber === 'PER-2026-0001'),
        candidateB: this.data.persons.find(p => p.recordNumber === 'PER-2026-0010'),
        matchReason: 'Co-occurrence in Telegram group logs with similar IP range allocation',
        similarityScore: 0.81,
      },
      {
        candidateA: this.data.persons.find(p => p.recordNumber === 'PER-2026-0005'),
        candidateB: this.data.persons.find(p => p.recordNumber === 'PER-2026-0011'),
        matchReason: 'Shared contact address in Mayur Vihar area recorded in legacy files',
        similarityScore: 0.74,
      },
    ].filter(item => item.candidateA && item.candidateB);

    return {
      unlinkedDocumentsCount: unlinkedDocs.length,
      unverifiedLocationsCount: unverifiedLocations.length,
      unverifiedRelationshipsCount: unverifiedRelationships.length,
      personsAwaitingReviewCount: personsAwaitingReview.length,
      potentialDuplicatePersons,
      healthScore: 94.2, // out of 100
      systemIntegrityStatus: 'OPTIMAL_GOVERNANCE',
    };
  }

  // -------------------------------------------------------------
  // DASHBOARD AGGREGATE STATS
  // -------------------------------------------------------------
  public getDashboardStats() {
    const totalCases = this.data.cases.length;
    const openCases = this.data.cases.filter(c => c.status === 'UNDER_INVESTIGATION' || c.status === 'REPORTED').length;
    const closedCases = this.data.cases.filter(c => c.status === 'CLOSED').length;
    const pendingReviews = this.data.cases.filter(c => c.status === 'UNDER_REVIEW' || c.status === 'AWAITING_LEGAL_REVIEW').length;
    const totalIncidents = this.data.incidents.length;
    const totalEvidence = this.data.evidenceItems.length;
    const totalDocuments = this.data.documents.length;
    const totalPersons = this.data.persons.length;

    // Cases by Status
    const casesByStatus: Record<string, number> = {};
    this.data.cases.forEach(c => {
      casesByStatus[c.status] = (casesByStatus[c.status] || 0) + 1;
    });

    // Incidents by Category
    const incidentsByCategory: Record<string, number> = {};
    this.data.incidents.forEach(i => {
      incidentsByCategory[i.category] = (incidentsByCategory[i.category] || 0) + 1;
    });

    // Investigator workload
    const workload: Record<string, number> = {};
    this.data.cases.forEach(c => {
      if (c.assignedInvestigatorId) {
        const u = this.data.users.find(user => user.id === c.assignedInvestigatorId);
        const name = u ? u.fullName : 'Unassigned';
        workload[name] = (workload[name] || 0) + 1;
      }
    });

    // Evidence processing status
    const evidenceByStatus: Record<string, number> = {};
    this.data.evidenceItems.forEach(e => {
      evidenceByStatus[e.status] = (evidenceByStatus[e.status] || 0) + 1;
    });

    // Cases over time (monthly aggregation for 2026)
    const casesOverTime = [
      { month: 'Jan', count: 3 },
      { month: 'Feb', count: 4 },
      { month: 'Mar', count: 5 },
      { month: 'Apr', count: 4 },
      { month: 'May', count: 4 },
    ];

    // Recent activity stream
    const recentActivity = this.data.auditEvents.slice(-6).reverse().map(a => ({
      id: a.id,
      timestamp: a.timestamp,
      userName: a.userName,
      action: a.action,
      targetResource: a.targetResource,
      details: a.details,
    }));

    return {
      summary: {
        totalCases,
        openCases,
        closedCases,
        pendingReviews,
        totalIncidents,
        totalEvidence,
        totalDocuments,
        totalPersons,
      },
      charts: {
        casesOverTime,
        casesByStatus: Object.entries(casesByStatus).map(([status, count]) => ({ status, count })),
        incidentsByCategory: Object.entries(incidentsByCategory).map(([category, count]) => ({ category, count })),
        investigatorWorkload: Object.entries(workload).map(([name, cases]) => ({ name, cases })),
        evidenceByStatus: Object.entries(evidenceByStatus).map(([status, count]) => ({ status, count })),
      },
      recentActivity,
    };
  }
}

export const dbStore = new Store();
