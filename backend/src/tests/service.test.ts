import { describe, it, expect } from 'vitest';
import { dbStore } from '../database/store.js';
import { ROLE_PERMISSIONS, PERMISSIONS } from '../config/index.js';

describe('CipherOps AI — Core System & Business Logic Verification', () => {
  it('Loads baseline dataset with at least 20 cases, 30 persons, 25 incidents, 15 locations, 40 documents, 20 evidence items', () => {
    expect(dbStore.data.cases.length).toBeGreaterThanOrEqual(20);
    expect(dbStore.data.persons.length).toBeGreaterThanOrEqual(30);
    expect(dbStore.data.incidents.length).toBeGreaterThanOrEqual(25);
    expect(dbStore.data.locations.length).toBeGreaterThanOrEqual(15);
    expect(dbStore.data.documents.length).toBeGreaterThanOrEqual(40);
    expect(dbStore.data.evidenceItems.length).toBeGreaterThanOrEqual(20);
    expect(dbStore.data.vehicles.length).toBeGreaterThanOrEqual(10);
  });

  it('Enforces clear legal roles: distinguishes ACCUSED, VICTIM, WITNESS, COMPLAINANT, SUSPECT', () => {
    const roles = new Set(dbStore.data.persons.map(p => p.primaryLegalRole));
    expect(roles.has('ACCUSED')).toBe(true);
    expect(roles.has('VICTIM')).toBe(true);
    expect(roles.has('WITNESS')).toBe(true);
    expect(roles.has('COMPLAINANT')).toBe(true);
    expect(roles.has('SUSPECT')).toBe(true);
    expect(roles.has('CONVICTED')).toBe(true);
  });

  it('Verifies cryptographic tamper-evident custody chain integrity', () => {
    const evidenceItem = dbStore.getEvidenceById('evi-001');
    expect(evidenceItem).toBeDefined();
    expect(evidenceItem?.isChainValid).toBe(true);
    expect(evidenceItem?.custodyEvents.length).toBeGreaterThan(0);
    
    // Check that each block's previousHash matches the prior block's currentHash
    const events = evidenceItem!.custodyEvents;
    for (let i = 1; i < events.length; i++) {
      expect(events[i].previousHash).toBe(events[i - 1].currentHash);
    }
  });

  it('Executes custody transfer and appends new tamper-evident hash', () => {
    const beforeCount = dbStore.data.evidenceCustodyEvents.length;
    const newEvent = dbStore.transferCustody('evi-002', {
      newCustodianName: 'Forensic Officer Inspector Verma',
      reason: 'Microscopic fiber analysis under Section 165 CrPC',
      location: 'SFSL Biology Division Locker B-2',
    });

    expect(newEvent).toBeDefined();
    expect(newEvent?.currentHash).toBeDefined();
    expect(newEvent?.previousHash).toBeDefined();
    expect(dbStore.data.evidenceCustodyEvents.length).toBe(beforeCount + 1);

    const verified = dbStore.getEvidenceById('evi-002');
    expect(verified?.isChainValid).toBe(true);
  });

  it('Verifies tamper-evident audit ledger cryptographic chaining', () => {
    const auditReport = dbStore.getAuditEvents();
    expect(auditReport.isChainValid).toBe(true);
    expect(auditReport.totalCount).toBeGreaterThan(0);
  });

  it('Enforces Role-Based Access Control matrix', () => {
    // Administrator has all permissions
    expect(ROLE_PERMISSIONS.SYSTEM_ADMINISTRATOR).toContain(PERMISSIONS.USER_MANAGE);
    expect(ROLE_PERMISSIONS.SYSTEM_ADMINISTRATOR).toContain(PERMISSIONS.CASE_DELETE);

    // Investigator has case edit and document upload, but NOT user manage
    expect(ROLE_PERMISSIONS.INVESTIGATOR).toContain(PERMISSIONS.CASE_EDIT);
    expect(ROLE_PERMISSIONS.INVESTIGATOR).not.toContain(PERMISSIONS.USER_MANAGE);

    // Read-only auditor can view audit logs and cases, but CANNOT create cases or edit evidence
    expect(ROLE_PERMISSIONS.READ_ONLY_AUDITOR).toContain(PERMISSIONS.AUDIT_VIEW);
    expect(ROLE_PERMISSIONS.READ_ONLY_AUDITOR).toContain(PERMISSIONS.CASE_VIEW);
    expect(ROLE_PERMISSIONS.READ_ONLY_AUDITOR).not.toContain(PERMISSIONS.CASE_CREATE);
    expect(ROLE_PERMISSIONS.READ_ONLY_AUDITOR).not.toContain(PERMISSIONS.EVIDENCE_CREATE);
  });

  it('AI Case Assistant produces grounded 7-part response with citations and safeguards', () => {
    const result = dbStore.askAIAssistant('Summarize investigation timeline for Case CAS-2026-0812', 'cas-001');
    expect(result.summary).toBeDefined();
    expect(result.documentedFacts).toBeInstanceOf(Array);
    expect(result.relevantTimeline).toBeInstanceOf(Array);
    expect(result.relatedRecords).toBeInstanceOf(Array);
    expect(result.potentialInconsistencies).toBeInstanceOf(Array);
    expect(result.missingInformation).toBeInstanceOf(Array);
    expect(result.citations).toBeInstanceOf(Array);
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.disclaimer).toContain('DECISION-SUPPORT NOTICE');
  });

  it('Computes geographic proximity using Haversine formula on real coordinates', () => {
    // Center at Connaught Place (28.6315, 77.2167) with 5km radius
    const nearby = dbStore.getMapData({
      lat: 28.6315,
      lng: 77.2167,
      radiusKm: 5,
    });

    expect(nearby.incidents.length).toBeGreaterThan(0);
    nearby.incidents.forEach((inc: any) => {
      expect(inc.distanceKm).toBeLessThanOrEqual(5.0);
    });
  });

  it('Data Quality Engine identifies unverified candidate records without automatic merging', () => {
    const metrics = dbStore.getDataQualityMetrics();
    expect(metrics.healthScore).toBeGreaterThan(80);
    expect(metrics.potentialDuplicatePersons.length).toBeGreaterThan(0);
    expect(metrics.potentialDuplicatePersons[0].similarityScore).toBeGreaterThan(0.7);
  });
});
