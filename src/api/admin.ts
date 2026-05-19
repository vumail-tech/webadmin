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

export const adminResetMailboxPassword = (domain: string, mailboxId: string) =>
  postDoc(`${BASE}/domains/${domain}/mailboxes/${mailboxId}/reset-password`, {});

export const adminGetSignature = (domain: string, mailboxId: string) =>
  getDoc(`${BASE}/domains/${domain}/mailboxes/${mailboxId}/signature`);

export const adminSetSignature = (
  domain: string,
  mailboxId: string,
  data: { html: string; text: string }
) => putDoc(`${BASE}/domains/${domain}/mailboxes/${mailboxId}/signature`, data);

export const adminGetMailSettings = () => getDoc(`${BASE}/mail-settings`);

// ─── Aliases ─────────────────────────────────────────────────────────────────
export const adminGetAliases = (domain: string) =>
  getDoc(`${BASE}/domains/${domain}/aliases`);

export const adminAddAlias = (
  domain: string,
  data: { mailboxAddresses: string[]; alias: string }
) => postDoc(`${BASE}/domains/${domain}/aliases`, data);

export const adminDeleteAlias = (
  domain: string,
  data: { alias: string; mailboxAddress: string }
) => postDoc(`${BASE}/domains/${domain}/aliases/delete`, data);

export const adminToggleAlias = (
  domain: string,
  data: { alias: string; active: boolean; mailboxAddress: string }
) => patchDoc(`${BASE}/domains/${domain}/aliases`, data);

// ─── DNS Verification ─────────────────────────────────────────────────────────
export const adminVerifyDomainDNS = (domain: string) =>
  postDoc(`${BASE}/domains/${domain}/dns/verify`, {});

export const adminConfigureCloudflare = (
  domain: string,
  data: { apiToken: string; zoneId: string }
) => postDoc(`${BASE}/domains/${domain}/dns/cloudflare`, data);

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

export const adminBulkMigration = (
  domain: string,
  data: {
    imapHost: string;
    imapPort: number;
    encryption: string;
    accounts: { sourceEmail: string; sourcePassword: string }[];
    incremental?: boolean;
    preserveFolders?: boolean;
    preserveFlags?: boolean;
    skipLarge?: boolean;
    maxSizeMB?: number;
  }
) => postDoc(`${BASE}/domains/${domain}/migration/bulk`, data);

// ─── Transactional Email ──────────────────────────────────────────────────────
export const adminGetTransactionalKeys = () =>
  getDoc(`${BASE}/transactional/keys`);

export const adminGenerateTransactionalKey = (domain: string) =>
  postDoc(`${BASE}/transactional/${domain}/keys`, {});

export const adminRevokeTransactionalKey = (domain: string, keyId: string) =>
  deleteDoc(`${BASE}/transactional/${domain}/keys/${keyId}`);

export const adminGetTransactionalLogs = (
  domain: string,
  params?: { page?: number; limit?: number; status?: string }
) => getDoc(`${BASE}/transactional/${domain}/logs`, { params });

// ─── Marketing — Campaigns ───────────────────────────────────────────────────
export const adminGetCampaigns = (params?: { page?: number; limit?: number; status?: string }) =>
  getDoc(`${BASE}/marketing/campaigns`, { params });

export const adminCreateCampaign = (data: Record<string, any>) =>
  postDoc(`${BASE}/marketing/campaigns`, data);

export const adminUpdateCampaign = (id: string, data: Record<string, any>) =>
  putDoc(`${BASE}/marketing/campaigns/${id}`, data);

export const adminDeleteCampaign = (id: string) =>
  deleteDoc(`${BASE}/marketing/campaigns/${id}`);

export const adminSendCampaign = (id: string) =>
  postDoc(`${BASE}/marketing/campaigns/${id}/send`, {});

export const adminScheduleCampaign = (id: string, scheduledAt: string) =>
  postDoc(`${BASE}/marketing/campaigns/${id}/schedule`, { scheduledAt });

// ─── Marketing — Contact Lists ────────────────────────────────────────────────
export const adminGetContactLists = () =>
  getDoc(`${BASE}/marketing/lists`);

export const adminCreateContactList = (data: { name: string; description?: string }) =>
  postDoc(`${BASE}/marketing/lists`, data);

export const adminDeleteContactList = (id: string) =>
  deleteDoc(`${BASE}/marketing/lists/${id}`);

export const adminGetListContacts = (id: string, params?: { page?: number; limit?: number; search?: string }) =>
  getDoc(`${BASE}/marketing/lists/${id}/contacts`, { params });

export const adminImportContacts = (id: string, data: { contacts: { email: string; name?: string; [key: string]: any }[] }) =>
  postDoc(`${BASE}/marketing/lists/${id}/contacts`, data);

export const adminRemoveContact = (listId: string, email: string) =>
  deleteDoc(`${BASE}/marketing/lists/${listId}/contacts/${encodeURIComponent(email)}`);

// ─── Marketing — Templates ────────────────────────────────────────────────────
export const adminGetTemplates = () =>
  getDoc(`${BASE}/marketing/templates`);

export const adminGetTemplate = (id: string) =>
  getDoc(`${BASE}/marketing/templates/${id}`);

export const adminCreateTemplate = (data: Record<string, any>) =>
  postDoc(`${BASE}/marketing/templates`, data);

export const adminUpdateTemplate = (id: string, data: Record<string, any>) =>
  putDoc(`${BASE}/marketing/templates/${id}`, data);

export const adminDeleteTemplate = (id: string) =>
  deleteDoc(`${BASE}/marketing/templates/${id}`);
