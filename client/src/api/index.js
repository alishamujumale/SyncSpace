import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Auth
export const getMe = () => API.get('/auth/me');
export const logout = () => API.get('/auth/logout');

// Documents
export const getDocuments = () => API.get('/api/documents');
export const getDocument = (id) => API.get(`/api/documents/${id}`);
export const createDocument = (title) => API.post('/api/documents', { title });
export const updateDocument = (id, data) => API.put(`/api/documents/${id}`, data);
export const deleteDocument = (id) => API.delete(`/api/documents/${id}`);

// Rooms
export const getRooms = () => API.get('/api/rooms');
export const getRoom = (id) => API.get(`/api/rooms/${id}`);
export const createRoom = (data) => API.post('/api/rooms', data);
export const joinRoom = (inviteCode) => API.post('/api/rooms/join', { inviteCode });
export const deleteRoom = (id) => API.delete(`/api/rooms/${id}`);

// Tasks
export const getRoomTasks = (roomId) => API.get(`/api/tasks/room/${roomId}`);
export const createTask = (data) => API.post('/api/tasks', data);
export const updateTask = (id, data) => API.put(`/api/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/api/tasks/${id}`);

// Messages
export const getMessages = (roomId) => API.get(`/api/messages/${roomId}`);

// Comments
export const getComments = (docId) => API.get(`/api/comments/${docId}`);
export const addComment = (docId, text) => API.post(`/api/comments/${docId}`, { text });
export const deleteComment = (commentId) => API.delete(`/api/comments/${commentId}`);

// Versions
export const getVersions = (docId) => API.get(`/api/documents/${docId}/versions`);

// AI
export const generatePlan = (idea, roomId) => API.post('/api/ai/generate-plan', { idea, roomId });
export const askAI = (question, roomId) => API.post('/api/ai/ask', { question, roomId });
export const summarizeChat = (roomId) => API.post('/api/ai/summarize', { roomId });