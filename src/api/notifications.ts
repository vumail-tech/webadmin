import { getDoc, patchDoc } from "./wrappers";

const BASE = "/notifications";

export const getNotifications = (params?: { page?: number; limit?: number }) =>
  getDoc(BASE, { params });

export const getUnreadCount = () => getDoc(`${BASE}/unread-count`);

export const markNotificationRead = (id: string) =>
  patchDoc(`${BASE}/${id}/read`, {});

export const markAllNotificationsRead = () => patchDoc(`${BASE}/read-all`, {});
