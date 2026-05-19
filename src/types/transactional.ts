export type TransactionalDomain = {
  domain: string;
  status: "ACTIVE" | "PENDING_DNS" | "SUSPENDED";
  hasKey: boolean;
  keyId?: string;
  keyPreview?: string;
  createdAt?: string;
  lastUsed?: string;
  sentCount?: number;
};

export type GeneratedKey = {
  key: string;
  keyId: string;
};

export type TransactionalLog = {
  _id: string;
  to: string;
  subject: string;
  status: "delivered" | "bounced" | "deferred" | "failed";
  timestamp: string;
  messageId?: string;
};
