import { API } from "../context/AuthContext";

// ===================== MEETINGS =====================
export const meetingsAPI = {
  getAll:   (params)      => API.get("/meetings", { params }),
  getById:  (id)          => API.get(`/meetings/${id}`),
  create:   (data)        => API.post("/meetings", data),
  update:   (id, data)    => API.patch(`/meetings/${id}`, data),
  delete:   (id)          => API.delete(`/meetings/${id}`),
  getStats: ()            => API.get("/meetings/stats/overview"),
};

// ===================== NOTES =====================
export const notesAPI = {
  getByMeeting:     (meetingId, params) => API.get(`/notes/meeting/${meetingId}`, { params }),
  create:           (data)              => API.post("/notes", data),
  update:           (id, data)          => API.patch(`/notes/${id}`, data),
  delete:           (id)                => API.delete(`/notes/${id}`),
  toggleActionItem: (noteId, itemId)    => API.patch(`/notes/${noteId}/action-items/${itemId}`),
  togglePin:        (id)                => API.patch(`/notes/${id}/pin`),
};

// ===================== RECORDINGS =====================
export const recordingsAPI = {
  getByMeeting: (meetingId) =>
    API.get(`/recordings/meeting/${meetingId}`),

  upload: (formData) =>
    API.post("/recordings/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id, data) =>
    API.patch(`/recordings/${id}`, data),

  delete: (id) =>
    API.delete(`/recordings/${id}`),

  getUrl: (filename) =>
        `https://startup-dashboard-3v28.onrender.com/uploads/${filename}`,};

// ===================== FILES (✅ FIX ADDED) =====================
export const filesAPI = {
  upload: (formData) =>
    API.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getByMeeting: (meetingId) =>
    API.get(`/files/meeting/${meetingId}`),

  delete: (id) =>
    API.delete(`/files/${id}`),

  getUrl: (filename) =>
      `https://startup-dashboard-3v28.onrender.com/uploads/${filename}`,};

// ===================== COMPANIES =====================
export const companiesAPI = {
  getAll:       (params)           => API.get("/companies", { params }),
  getById:      (id)               => API.get(`/companies/${id}`),
  create:       (data)             => API.post("/companies", data),
  update:       (id, data)         => API.patch(`/companies/${id}`, data),
  delete:       (id)               => API.delete(`/companies/${id}`),
  getMeetings:  (id)               => API.get(`/companies/${id}/meetings`),
  getTime:      (id)               => API.get(`/companies/${id}/time`),
  startSession: (id)               => API.post(`/companies/${id}/session/start`),

  // ✅ FIXED
  endSession: (id, sessionId, data) =>
    API.post(`/companies/${id}/session/end`, {
      sessionId,
      ...data,
    }),
};

// ===================== ADMIN =====================
export const adminAPI = {
  getUsers:   (params)   => API.get("/admin/users", { params }),
  updateUser: (id, data) => API.patch(`/admin/users/${id}`, data),
  deleteUser: (id)       => API.delete(`/admin/users/${id}`),
};


