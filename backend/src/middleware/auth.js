import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { store } from '../services/store.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required. Please sign in.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = store.findById('users', decoded.email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or session invalidated.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.studentId,
      facultyId: user.facultyId,
      department: user.department || 'CSE',
      section: user.section
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.'
    });
  }
}

export function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to ${allowed.join(' or ')} accounts.`
      });
    }
    next();
  };
}

export function normalizeSectionName(sec) {
  if (!sec) return '';
  const clean = String(sec).trim();
  const match = clean.match(/^(?:3rd\s+Year\s+)?(?:Section\s+)?([A-Za-z0-9]+)$/i);
  if (match) {
    return `3rd Year Section ${match[1].toUpperCase()}`;
  }
  return clean;
}

export function requireFacultySectionAccess(paramName = 'sectionId') {
  return (req, res, next) => {
    if (req.user.role === 'HOD') {
      // HOD has universal department oversight
      return next();
    }

    if (req.user.role !== 'FACULTY') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Faculty authorization required.'
      });
    }

    const targetSection = req.params[paramName] || req.body[paramName] || req.query[paramName];

    // Read queries (GET): authenticated faculty in CSE can view all sections within CSE
    if (req.method === 'GET') {
      if (!targetSection || targetSection.toUpperCase() === 'ALL' || targetSection.toLowerCase() === 'all sections') {
        return next();
      }
      if (req.user.department === 'CSE') {
        return next();
      }
    }

    if (!targetSection) {
      return res.status(400).json({
        success: false,
        message: 'Section parameter is required for authorization validation.'
      });
    }

    // Modification queries (POST, PUT, DELETE): Check faculty's assigned classes from teaching assignments or profile
    const facultyDoc = store.findById('faculty', req.user.facultyId);
    const assignedSections = (facultyDoc?.assignedClasses || []).map(ac => ac.section);
    
    // Also check teaching assignments collection
    const assignments = store.find('teachingAssignments', ta => ta.facultyId === req.user.facultyId);
    assignments.forEach(a => assignedSections.push(a.section));

    const normalizedTarget = normalizeSectionName(targetSection);
    const normalizedAssigned = assignedSections.map(normalizeSectionName);

    const isAssigned = normalizedAssigned.includes(normalizedTarget) || assignedSections.includes(targetSection);
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: `Unauthorized: You do not have teaching permissions for ${targetSection}.`
      });
    }

    next();
  };
}
