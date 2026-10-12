const BASE_URL = '/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('cc_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let errorMsg = data?.message;
      if (!errorMsg) {
        if (res.status === 401) {
          errorMsg = 'Invalid college email or password.';
        } else if (res.status === 403) {
          errorMsg = 'Access denied. Account may be unverified or unauthorized.';
        } else if (res.status === 503) {
          errorMsg = 'CampusConnect backend service is offline. Please ensure the backend server is running on port 5000.';
        } else if (res.status === 500) {
          errorMsg = 'An unexpected server error occurred (HTTP 500). Please try again or check backend logs.';
        } else {
          errorMsg = `Request failed with status ${res.status}`;
        }
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      throw new Error('Unable to connect to CampusConnect backend API server on port 5000. Please check your connection.');
    }
    throw err;
  }
}

export const api = {
  // Auth
  requestOtp: (email, purpose) => apiRequest('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email, purpose }) }),
  verifyOtp: (email, otp) => apiRequest('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => apiRequest('/auth/me'),

  // Student
  getStudentProfile: () => apiRequest('/students/profile'),
  getStudentMarks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/students/marks${query ? `?${query}` : ''}`);
  },
  getStudentAttendance: () => apiRequest('/students/attendance'),
  getStudentFees: () => apiRequest('/students/fees'),
  getStudentImprovement: () => apiRequest('/students/improvement'),
  getStudentStudyGoals: () => apiRequest('/students/study-goals'),
  createStudentStudyGoal: (payload) => apiRequest('/students/study-goals', { method: 'POST', body: JSON.stringify(payload) }),
  toggleStudentStudyGoal: (goalId) => apiRequest(`/students/study-goals/${encodeURIComponent(goalId)}`, { method: 'PATCH' }),
  deleteStudentStudyGoal: (goalId) => apiRequest(`/students/study-goals/${encodeURIComponent(goalId)}`, { method: 'DELETE' }),
  getStudentRiskInsights: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/students/risk-insights${query ? `?${query}` : ''}`);
  },
  getStudentAnnouncements: () => apiRequest('/students/announcements'),
  requestCorrection: (payload) => apiRequest('/students/request-correction', { method: 'POST', body: JSON.stringify(payload) }),

  // Faculty
  getFacultyOverview: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/faculty/overview${query ? `?${query}` : ''}`);
  },
  getMyClasses: () => apiRequest('/faculty/my-classes'),
  getSectionStudents: (sectionName, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = (!sectionName || sectionName === 'ALL' || sectionName === 'All Sections')
      ? `/faculty/students${query ? `?${query}` : ''}`
      : `/faculty/sections/${encodeURIComponent(sectionName)}/students${query ? `?${query}` : ''}`;
    return apiRequest(endpoint);
  },
  getFacultyStudentProfile: (studentId) => apiRequest(`/faculty/students/${encodeURIComponent(studentId)}`),
  updateStudent: (studentId, payload) => apiRequest(`/faculty/students/${encodeURIComponent(studentId)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  addStudent: (payload) => apiRequest('/faculty/students', { method: 'POST', body: JSON.stringify(payload) }),
  markAttendance: (payload) => apiRequest('/faculty/attendance', { method: 'POST', body: JSON.stringify(payload) }),
  updateAttendance: (sessionId, payload) => apiRequest(`/faculty/attendance/${encodeURIComponent(sessionId)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  createAssessment: (payload) => apiRequest('/faculty/assessments', { method: 'POST', body: JSON.stringify(payload) }),
  enterMarks: (payload) => apiRequest('/faculty/marks', { method: 'POST', body: JSON.stringify(payload) }),
  logIntervention: (payload) => apiRequest('/faculty/interventions', { method: 'POST', body: JSON.stringify(payload) }),
  getInterventions: () => apiRequest('/faculty/interventions'),

  // HOD
  getHodOverview: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/hod/overview${query ? `?${query}` : ''}`);
  },
  getFacultyList: () => apiRequest('/hod/faculty'),
  addFaculty: (payload) => apiRequest('/hod/faculty', { method: 'POST', body: JSON.stringify(payload) }),
  removeFaculty: (facultyId) => apiRequest(`/hod/faculty/${encodeURIComponent(facultyId)}`, { method: 'DELETE' }),
  deleteTeachingAssignment: (assignmentId) => apiRequest(`/hod/assignments/${encodeURIComponent(assignmentId)}`, { method: 'DELETE' }),
  getHodStudentProfile: (studentId) => apiRequest(`/hod/students/${encodeURIComponent(studentId)}`),
  toggleFacultyStatus: (facultyId) => apiRequest(`/hod/faculty/${facultyId}/status`, { method: 'PATCH' }),
  exportReport: (reportTypeOrParams, section) => {
    if (typeof reportTypeOrParams === 'object') {
      const query = new URLSearchParams(reportTypeOrParams).toString();
      return apiRequest(`/hod/reports?${query}`);
    }
    return apiRequest(`/hod/reports?reportType=${reportTypeOrParams}&section=${section || 'ALL'}`);
  },

  // Analytics
  getRiskAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/analytics/risk-distribution${query ? `?${query}` : ''}`);
  },
  predictStudentRisk: (studentId) => apiRequest(`/analytics/students/${studentId}/predict`)
};
