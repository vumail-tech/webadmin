import { getDoc, postDoc, patchDoc, deleteDoc, putDoc } from "./wrappers";

const BASE = "/admin";

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const getDashboardStats = () => getDoc(`${BASE}/dashboard`);

// ─── Domains ─────────────────────────────────────────────────────────────────
export const adminGetDomains = (params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => getDoc(`${BASE}/domains`, { params });

export const adminGetDomain = (domain: string) =>
  getDoc(`${BASE}/domains/${domain}`);

export const adminCreateDomain = (data: {
  domain: string;
  description?: string;
  mailboxes?: number;
  maxquota?: number;
}) => postDoc(`${BASE}/domains`, data);

export const adminUpdateDomain = (domain: string, data: Record<string, any>) =>
  putDoc(`${BASE}/domains/${domain}`, data);

export const adminDeleteDomain = (domain: string) =>
  deleteDoc(`${BASE}/domains/${domain}`);

// ─── Mailboxes ────────────────────────────────────────────────────────────────
export const adminGetMailboxes = (domain: string) =>
  getDoc(`${BASE}/domains/${domain}/mailboxes`);

export const adminCreateMailbox = (domain: string, data: Record<string, any>) =>
  postDoc(`${BASE}/domains/${domain}/mailboxes`, data);

export const adminUpdateMailbox = (
  domain: string,
  mailboxId: string,
  data: Record<string, any>
) => putDoc(`${BASE}/domains/${domain}/mailboxes/${mailboxId}`, data);

export const adminDeleteMailbox = (domain: string, mailboxId: string) =>
  deleteDoc(`${BASE}/domains/${domain}/mailboxes/${mailboxId}`);

// ─── Aliases ─────────────────────────────────────────────────────────────────
export const adminGetAliases = (domain: string) =>
  getDoc(`${BASE}/domains/${domain}/aliases`);

export const adminAddAlias = (
  domain: string,
  data: { mailboxAddress: string; alias: string }
) => postDoc(`${BASE}/domains/${domain}/aliases`, data);

export const adminDeleteAlias = (
  domain: string,
  data: { alias: string; mailboxAddress: string }
) => postDoc(`${BASE}/domains/${domain}/aliases/delete`, data);

export const adminToggleAlias = (
  domain: string,
  data: { alias: string; active: boolean; mailboxAddress: string }
) => patchDoc(`${BASE}/domains/${domain}/aliases`, data);

// ─── Storage ─────────────────────────────────────────────────────────────────
export const adminGetStorage = (domain: string) =>
  getDoc(`${BASE}/domains/${domain}/storage`);

// ─── Metrics ─────────────────────────────────────────────────────────────────
export const adminGetMetrics = (domain: string) =>
  getDoc(`${BASE}/domains/${domain}/metrics`);

// ─── Sending Rules ────────────────────────────────────────────────────────────
export const adminGetSendingRules = (domain: string) =>
  getDoc(`${BASE}/domains/${domain}/sending-rules`);

export const adminUpdateSendingRules = (
  domain: string,
  data: Record<string, any>
) => putDoc(`${BASE}/domains/${domain}/sending-rules`, data);

// ─── Security ────────────────────────────────────────────────────────────────
export const adminGetSecurity = (domain: string) =>
  getDoc(`${BASE}/domains/${domain}/security`);

export const adminUpdateSecurity = (
  domain: string,
  data: Record<string, any>
) => putDoc(`${BASE}/domains/${domain}/security`, data);

// ─── Advanced ────────────────────────────────────────────────────────────────
export const adminGetAdvanced = (domain: string) =>
  getDoc(`${BASE}/domains/${domain}/advanced`);

export const adminUpdateAdvanced = (
  domain: string,
  data: Record<string, any>
) => putDoc(`${BASE}/domains/${domain}/advanced`, data);

// ─── Migration ────────────────────────────────────────────────────────────────
export const adminTestMigration = (
  domain: string,
  data: Record<string, any>
) => postDoc(`${BASE}/domains/${domain}/migration/test`, data);

export const adminStartMigration = (
  domain: string,
  data: Record<string, any>
) => postDoc(`${BASE}/domains/${domain}/migration/start`, data);
