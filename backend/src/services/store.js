import { buildSeedDatabase } from '../seeds/seedData.js';
import { initializeFirebase, getFirestore } from './firebase.js';

function sanitizeForFirestore(doc) {
  if (!doc || typeof doc !== 'object') return {};
  const clean = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

class AuthoritativeStore {
  constructor() {
    this.collections = {};
    this.initialize();
  }

  initialize() {
    console.log('[CampusConnect Store] Initializing authoritative dataset...');
    const seed = buildSeedDatabase();
    this.collections = {
      users: new Map(seed.users.map(u => [u.id, u])),
      students: new Map(seed.students.map(s => [s.id, s])),
      faculty: new Map(seed.faculty.map(f => [f.id, f])),
      subjects: new Map(seed.subjects.map(sub => [sub.id, sub])),
      teachingAssignments: new Map(seed.teachingAssignments.map(ta => [ta.id, ta])),
      attendanceSessions: new Map(seed.attendanceSessions.map(sess => [sess.id, sess])),
      assessments: new Map(seed.assessments.map(a => [a.id, a])),
      marks: new Map(seed.marks.map(m => [m.id, m])),
      feeAccounts: new Map(seed.feeAccounts.map(fa => [fa.id, fa])),
      riskPredictions: new Map(seed.riskPredictions.map(rp => [rp.id, rp])),
      interventions: new Map(seed.interventions.map(i => [i.id, i])),
      announcements: new Map(seed.announcements.map(ann => [ann.id, ann])),
      auditLogs: new Map(seed.auditLogs.map(al => [al.id, al])),
      authorizedHods: new Map((seed.authorizedHods || []).map(ah => [ah.id, ah])),
      studyGoals: new Map(),
      otpChallenges: new Map() // Ephemeral in-memory only; never written to public Firestore
    };
    console.log(`[CampusConnect Store] Loaded ${this.collections.students.size} students across III Year CSE.`);

    this.repairAccounts();

    // Initialize Firebase Admin SDK connection if configured
    try {
      initializeFirebase();
      this.hydrateFromFirestore().catch(e => {
        console.warn('[CampusConnect Store] Background hydration notice:', e.message);
      });
    } catch (err) {
      console.warn('[CampusConnect Store] Firebase init skipped:', err.message);
    }
  }

  repairAccounts() {
    // 1. Unblock any accounts previously marked pending approval
    for (const [id, user] of this.collections.users.entries()) {
      if (user.isApproved === false || (user.approvalStatus && user.approvalStatus.startsWith('PENDING_'))) {
        user.isApproved = true;
        user.approvalStatus = 'APPROVED';
        if ((user.role === 'FACULTY' || user.role === 'HOD') && user.facultyId) {
          const fac = this.collections.faculty.get(user.facultyId);
          if (fac) {
            fac.status = 'ACTIVE';
            fac.isActive = true;
          }
        }
      }
    }

    // 2. Migration and activation for legitimate HOD accounts
    const hodEmails = ['24221a1226@bvcgroup.in', '24221a0511@bvcgroup.in', 'hod.cse@bvcgroup.in'];
    for (const targetEmail of hodEmails) {
      const targetUser = this.collections.users.get(targetEmail);
      if (targetUser) {
        targetUser.role = 'HOD';
        targetUser.designation = targetUser.designation || 'Professor & Head of Department';
        targetUser.cabin = targetUser.cabin || 'Block B - Room 204';
        targetUser.department = 'CSE';
        targetUser.isApproved = true;
        targetUser.approvalStatus = 'APPROVED';
        targetUser.isVerified = true;
        this.collections.users.set(targetEmail, targetUser);

        // Find and update all associated faculty records
        let matchedFac = false;
        for (const [fId, fac] of this.collections.faculty.entries()) {
          if (fac.email === targetEmail || fId === `FAC_${targetUser.studentId}` || fId === 'hod cse' || fId === 'hod-cse-1') {
            fac.role = 'HOD';
            fac.name = targetUser.name || fac.name;
            fac.designation = 'Professor & Head of Department';
            fac.status = 'ACTIVE';
            fac.isActive = true;
            fac.department = 'CSE';
            fac.cabin = 'Block B - Room 204';
            matchedFac = true;
          }
        }
        if (!matchedFac) {
          const facId = targetUser.facultyId || `HOD_${targetEmail.split('@')[0].toUpperCase()}`;
          this.collections.faculty.set(facId, {
            id: facId,
            facultyId: facId,
            name: targetUser.name || 'Head of Department',
            email: targetEmail,
            role: 'HOD',
            designation: 'Professor & Head of Department',
            department: 'CSE',
            cabin: 'Block B - Room 204',
            status: 'ACTIVE',
            isActive: true,
            createdAt: new Date().toISOString()
          });
        }

        // Sync repaired records to Firestore
        try {
          const db = getFirestore();
          if (db) {
            db.collection('users').doc(targetEmail).set(sanitizeForFirestore(targetUser), { merge: true }).catch(() => {});
            for (const [fId, fac] of this.collections.faculty.entries()) {
              if (fac.email === targetEmail) {
                db.collection('faculty').doc(fId).set(sanitizeForFirestore(fac), { merge: true }).catch(() => {});
              }
            }
          }
        } catch (e) {}

        console.log(`[CampusConnect Store] Migrated and activated HOD account for ${targetEmail}`);
      }
    }

    // Also ensure all HOD faculty entries are ACTIVE
    for (const [fId, fac] of this.collections.faculty.entries()) {
      if (fac.role === 'HOD' && (fac.status !== 'ACTIVE' || fac.isActive !== true)) {
        fac.status = 'ACTIVE';
        fac.isActive = true;
        try {
          const db = getFirestore();
          if (db) db.collection('faculty').doc(fId).set(sanitizeForFirestore(fac), { merge: true }).catch(() => {});
        } catch (e) {}
      }
    }
  }

  async hydrateFromFirestore() {
    try {
      const db = getFirestore();
      if (!db) return;
      console.log('[CampusConnect Store] Hydrating persistent collections from Firestore...');
      const userSnap = await db.collection('users').get();
      userSnap.forEach(doc => {
        const data = doc.data();
        this.collections.users.set(data.id || doc.id, data);
      });
      const facSnap = await db.collection('faculty').get();
      facSnap.forEach(doc => {
        const data = doc.data();
        this.collections.faculty.set(data.id || doc.id, data);
      });
      console.log(`[CampusConnect Store] Hydrated ${userSnap.size} users and ${facSnap.size} faculty from Firestore.`);
      this.repairAccounts();
    } catch (err) {
      console.warn('[CampusConnect Store] Hydration notice:', err.message);
    }
  }

  get(collectionName) {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = new Map();
    }
    return Array.from(this.collections[collectionName].values());
  }

  findById(collectionName, id) {
    if (!this.collections[collectionName]) return null;
    return this.collections[collectionName].get(id) || null;
  }

  find(collectionName, filterFn) {
    const all = this.get(collectionName);
    return all.filter(filterFn);
  }

  create(collectionName, doc) {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = new Map();
    }
    const id = doc.id || `DOC_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newDoc = { ...doc, id };
    this.collections[collectionName].set(id, newDoc);

    // Asynchronously synchronize to Firestore if available (excluding ephemeral OTP challenges)
    if (collectionName !== 'otpChallenges') {
      try {
        const db = getFirestore();
        if (db) {
          const payload = sanitizeForFirestore(newDoc);
          db.collection(collectionName).doc(id).set(payload, { merge: true }).catch(err => {
            console.warn(`[Firestore Sync Notice] Collection ${collectionName} doc ${id}: ${err.message}`);
          });
        }
      } catch (syncErr) {
        console.warn(`[Firestore Sync Exception] ${collectionName}/${id}: ${syncErr.message}`);
      }
    }

    return newDoc;
  }

  update(collectionName, id, updates) {
    if (!this.collections[collectionName]) return null;
    const existing = this.collections[collectionName].get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.collections[collectionName].set(id, updated);

    if (collectionName !== 'otpChallenges') {
      try {
        const db = getFirestore();
        if (db) {
          const payload = sanitizeForFirestore(updated);
          db.collection(collectionName).doc(id).set(payload, { merge: true }).catch(err => {
            console.warn(`[Firestore Sync Notice] Collection ${collectionName} doc ${id}: ${err.message}`);
          });
        }
      } catch (syncErr) {
        console.warn(`[Firestore Sync Exception] ${collectionName}/${id}: ${syncErr.message}`);
      }
    }

    return updated;
  }

  delete(collectionName, id) {
    if (!this.collections[collectionName]) return false;
    const deleted = this.collections[collectionName].delete(id);

    if (deleted && collectionName !== 'otpChallenges') {
      try {
        const db = getFirestore();
        if (db) {
          db.collection(collectionName).doc(id).delete().catch(err => {
            console.warn(`[Firestore Sync Notice] Failed to delete ${collectionName}/${id}: ${err.message}`);
          });
        }
      } catch (syncErr) {
        console.warn(`[Firestore Sync Exception] Delete ${collectionName}/${id}: ${syncErr.message}`);
      }
    }

    return deleted;
  }

  logAudit(action, user, details) {
    const entry = {
      id: `AUD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      userEmail: user?.email || 'SYSTEM',
      userName: user?.name || 'System Process',
      role: user?.role || 'SYSTEM',
      details
    };
    this.create('auditLogs', entry);
    return entry;
  }
}

export const store = new AuthoritativeStore();
