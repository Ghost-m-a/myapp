/**
 * Shared DTO types — the exact JSON shapes the API returns and the
 * React client consumes. Dates cross the wire as ISO strings.
 */
import type { PubUser } from "@/lib/shape";

export type { PubUser };

export interface UserDTO {
   id: string;
   name: string;
   email: string;
   username: string;
   role: "advertiser" | "creator";
   avatar: string | null;
   credits: number;
   language: "en" | "ar";
   theme?: "light" | "dark";
   referralCode?: string;
   partnerVerified: boolean;
   economicIntel: boolean;
   isSystem: boolean;
   createdAt: string;
}

export interface BusinessDTO {
   id: string;
   owner: string;
   name: string;
   description: string;
   affiliateCommission: number;
   createdAt: string;
}

export interface NotificationDTO {
   id: string;
   text: string;
   read: boolean;
   createdAt: string;
}

export interface PostDTO {
   id: string;
   author: PubUser | null;
   business: { id: string; name: string } | null;
   forum: string;
   title: string;
   body: string;
   bounty: number;
   createdAt: string;
   likes: number;
   liked: boolean;
   comments: number;
   views: number;
}

export interface CommentDTO {
   id: string;
   author: PubUser | null;
   text: string;
   createdAt: string;
}

export interface ConversationDTO {
   id: string;
   other: PubUser | null;
   lastMessage: string;
   lastAt: string;
   unread: number;
   request: boolean;
}

export interface MessageDTO {
   id: string;
   sender: string;
   text: string;
   read: boolean;
   createdAt: string;
}

export interface CampaignDTO {
   id: string;
   title: string;
   description: string;
   category: string;
   cpm: number;
   budget: number;
   spent: number;
   platforms: string[];
   participants: number;
   joined: boolean;
   mine: boolean;
   business: { id: string; name: string } | null;
   createdAt: string;
}

/** Flattened record: { ...data fields, id, kind, createdAt } */
export type RecordDTO = Record<string, unknown> & {
   id: string;
   kind: string;
   createdAt: string;
};

export interface BizStats {
   balance: number;
   revenue: number;
   payments: number;
   customers: number;
   avg: number;
   today: number;
   window: {
      in: number;
      out: number;
      deposits: number;
      withdrawals: number;
      start: number;
   };
   series: { day: string; in: number; out: number }[];
   counts: Record<string, number>;
}

export interface CustomerDTO {
   email: string;
   spend: number;
   payments: number;
   joined: string;
   last: string;
}

export interface BusinessWithOwner {
   id: string;
   name: string;
   description: string;
   createdAt: string;
   owner: PubUser | null;
}

export interface PartnerMe {
   referralCode: string;
   enrolled: boolean;
   earnings: number;
   users: (PubUser & { createdAt: string })[];
   businesses: BusinessWithOwner[];
}

export interface DiscoverOverview {
   stats: { users: number; businesses: number; earned: number };
   businesses: BusinessWithOwner[];
}
