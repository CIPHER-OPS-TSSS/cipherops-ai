import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const personsRouter = Router();

personsRouter.use(authMiddleware);

// GET /api/persons - List persons
personsRouter.get('/', requirePermission(PERMISSIONS.PERSON_VIEW), (req: Request, res: Response) => {
  const { role, status, search } = req.query;
  const persons = dbStore.getPersons({
    role: role as string,
    status: status as string,
    search: search as string,
  });

  res.json({ persons, count: persons.length });
});

// GET /api/persons/:id - Person dossier
personsRouter.get('/:id', requirePermission(PERMISSIONS.PERSON_VIEW), (req: Request, res: Response) => {
  const person = dbStore.getPersonById(req.params.id);
  if (!person) {
    return res.status(404).json({ error: `Person record '${req.params.id}' not found` });
  }

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_ACCESS',
    targetResource: `Person:${person.recordNumber}`,
    details: `Viewed person record for ${person.fullName} (${person.recordNumber})`,
    ipAddress: req.ip,
  });

  res.json({ person });
});

// POST /api/persons - Create person
personsRouter.post('/', requirePermission(PERMISSIONS.PERSON_CREATE), (req: Request, res: Response) => {
  const { fullName, aliases, dateOfBirth, gender, nationalIdMasked, contactNumber, currentAddress, primaryLegalRole, identifyingMarks, sourceOfInfo } = req.body;

  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required' });
  }

  const newPerson = dbStore.createPerson({
    fullName,
    aliases: aliases || [],
    dateOfBirth,
    gender,
    nationalIdMasked,
    contactNumber,
    currentAddress,
    identifyingMarks: identifyingMarks || [],
    primaryLegalRole: primaryLegalRole || 'PERSON_OF_INTEREST',
    sourceOfInfo: sourceOfInfo || 'Official Investigative Entry',
  });

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_CREATE',
    targetResource: `Person:${newPerson.recordNumber}`,
    details: `Created person record for ${newPerson.fullName} (${newPerson.recordNumber}) with role ${newPerson.primaryLegalRole}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ message: 'Person record created successfully', person: newPerson });
});

// PATCH /api/persons/:id - Update person
personsRouter.patch('/:id', requirePermission(PERMISSIONS.PERSON_EDIT), (req: Request, res: Response) => {
  const updated = dbStore.updatePerson(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Person record not found' });
  }

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_UPDATE',
    targetResource: `Person:${updated.recordNumber}`,
    details: `Updated fields on person record ${updated.recordNumber}`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Person record updated successfully', person: updated });
});

// POST /api/persons/:id/link-case - Associate person with case with specific legal role
personsRouter.post('/:id/link-case', requirePermission(PERMISSIONS.PERSON_EDIT), (req: Request, res: Response) => {
  const { caseId, legalRole, chargesOrAllegations } = req.body;
  if (!caseId || !legalRole) {
    return res.status(400).json({ error: 'caseId and legalRole are required' });
  }

  const assoc = dbStore.linkPersonToCase(req.params.id, caseId, legalRole, chargesOrAllegations);

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_UPDATE',
    targetResource: `PersonCaseAssociation:${assoc.id}`,
    details: `Linked Person ${req.params.id} to Case ${caseId} as ${legalRole}`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Person linked to case successfully', association: assoc });
});
