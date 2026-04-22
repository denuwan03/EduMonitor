import api from "./api";

/**
 * Fetch all submissions (filtered by role on the backend).
 * Optionally pass query params: { status, search }
 */
export const fetchSubmissions = (params = {}) =>
  api.get("/submissions", { params }).then((r) => r.data);

/**
 * Fetch a single submission by id.
 */
export const fetchSubmissionById = (id) =>
  api.get(`/submissions/${id}`).then((r) => r.data);

/**
 * Create a new submission.
 * @param {FormData} formData - Must include: project_id, task_id, title, description, file
 */
export const createSubmission = (formData) =>
  api
    .post("/submissions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

/**
 * Resubmit / update an existing submission.
 * @param {string} id
 * @param {FormData} formData
 */
export const updateSubmission = (id, formData) =>
  api
    .put(`/submissions/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

/**
 * Delete a submission by id.
 */
export const deleteSubmission = (id) => api.delete(`/submissions/${id}`).then((r) => r.data);

/**
 * Fetch analytics for the student dashboard.
 */
export const fetchSubmissionAnalytics = () =>
  api.get("/submissions/analytics").then((r) => r.data);

/**
 * Fetch proof score for a specific submission (Supervisor only).
 * @param {string} submissionId
 */
export const fetchProofScore = (submissionId) =>
  api.get(`/submissions/proof-score/${submissionId}`).then((r) => r.data);
