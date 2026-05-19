export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "paused";

export type Campaign = {
  _id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  status: CampaignStatus;
  listId: string;
  listName?: string;
  templateId?: string;
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: string;
};

export type ContactList = {
  _id: string;
  name: string;
  description?: string;
  subscriberCount: number;
  createdAt: string;
  tags?: string[];
};

export type Contact = {
  email: string;
  name?: string;
  subscribedAt: string;
  status: "subscribed" | "unsubscribed" | "bounced";
  [key: string]: any;
};

// ─── Template / Block Editor ──────────────────────────────────────────────────

export type BlockAlign = "left" | "center" | "right";

export type HeaderBlock = {
  id: string;
  type: "header";
  text: string;
  level: 1 | 2 | 3;
  align: BlockAlign;
  color: string;
};

export type TextBlock = {
  id: string;
  type: "text";
  text: string;
  align: BlockAlign;
  color: string;
  fontSize: number;
};

export type ImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  link?: string;
  align: BlockAlign;
  width: string;
};

export type ButtonBlock = {
  id: string;
  type: "button";
  text: string;
  href: string;
  align: BlockAlign;
  bgColor: string;
  textColor: string;
  borderRadius: number;
};

export type DividerBlock = {
  id: string;
  type: "divider";
  color: string;
  thickness: number;
};

export type SpacerBlock = {
  id: string;
  type: "spacer";
  height: number;
};

export type Block =
  | HeaderBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock;

export type BlockType = Block["type"];

export type EmailTemplate = {
  _id: string;
  name: string;
  description?: string;
  subject?: string;
  previewText?: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
};
