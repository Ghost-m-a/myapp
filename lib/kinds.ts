/**
 * Field-spec DSL that drives both server-side record validation
 * (lib/records.ts) and the dynamic forms in the React UI.
 */

export type FieldType =
   | "string"
   | "text"
   | "number"
   | "enum"
   | "ref"
   | "bool"
   | "multi"
   | "email";

export interface Field {
   name: string;
   label: string;
   type: FieldType;
   required?: boolean;
   max?: number;
   min?: number;
   default?: unknown;
   options?: string[];
   ref?: string;
   upper?: boolean;
   /** UI hint only — the server still accepts the field. */
   hidden?: boolean;
}

export interface Kind {
   immutable?: boolean;
   fields: Field[];
}

const f = (
   name: string,
   label: string,
   type: FieldType = "string",
   extra: Partial<Field> = {},
): Field => ({ name, label, type, ...extra });

const kinds: Record<string, Kind> = {
   product: {
      fields: [
         f("name", "Name", "string", { required: true, max: 80 }),
         f("price", "Price (USD)", "number", { max: 1000000, default: 0 }),
         f("visibility", "Visibility", "enum", {
            options: ["visible", "hidden"],
            default: "visible",
         }),
         f("description", "Description", "text", { max: 500 }),
      ],
   },
   payment: {
      immutable: true,
      fields: [
         f("type", "Type", "enum", {
            options: ["payment", "deposit", "withdrawal"],
            default: "payment",
            hidden: true,
         }),
         f("amount", "Amount (USD)", "number", {
            required: true,
            min: 0.01,
            max: 1000000,
         }),
         f("email", "Customer email", "email", { max: 120 }),
         f("product", "Product", "ref", { ref: "product" }),
         f("method", "Method", "enum", {
            options: ["card", "crypto", "bank", "manual"],
            default: "manual",
         }),
         f("status", "Status", "enum", {
            options: ["succeeded", "pending", "failed"],
            default: "succeeded",
         }),
      ],
   },
   checkout: {
      fields: [
         f("product", "Product", "ref", { ref: "product", required: true }),
         f("notes", "Notes", "string", { max: 120 }),
         f("visibility", "Visibility", "enum", {
            options: ["visible", "hidden"],
            default: "visible",
         }),
         f("stock", "Stock (optional)", "number", { max: 1000000 }),
      ],
   },
   invoice: {
      fields: [
         f("email", "Customer email", "email", { required: true, max: 120 }),
         f("amount", "Amount (USD)", "number", {
            required: true,
            min: 0.01,
            max: 1000000,
         }),
         f("description", "Description", "string", { max: 200 }),
         f("status", "Status", "enum", {
            options: ["draft", "sent", "paid"],
            default: "sent",
         }),
      ],
   },
   promo: {
      fields: [
         f("code", "Code", "string", { required: true, max: 20, upper: true }),
         f("percentOff", "Percent off", "number", {
            required: true,
            min: 1,
            max: 100,
         }),
         f("maxUses", "Max uses (optional)", "number", {
            min: 1,
            max: 1000000,
         }),
         f("active", "Active", "bool", { default: true }),
      ],
   },
   ad: {
      fields: [
         f("platform", "Platform", "enum", {
            options: ["meta", "tiktok", "google", "x", "reddit"],
            default: "meta",
         }),
         f("objective", "Objective", "enum", {
            options: ["sales", "leads", "engagement", "traffic", "awareness"],
            default: "sales",
         }),
         f("title", "Campaign title", "string", { required: true, max: 80 }),
         f("budgetType", "Budget type", "enum", {
            options: ["daily", "lifetime"],
            default: "daily",
         }),
         f("budget", "Budget (USD)", "number", {
            required: true,
            min: 1,
            max: 1000000,
         }),
         f("status", "Status", "enum", {
            options: ["paused", "active"],
            default: "paused",
            hidden: true,
         }),
      ],
   },
   website: {
      fields: [
         f("name", "Website name", "string", { required: true, max: 60 }),
         f("blueprint", "Blueprint", "enum", {
            options: [
               "blank",
               "neobank",
               "ecommerce",
               "software",
               "agency",
               "service",
               "gym",
               "trading",
               "books",
            ],
            default: "blank",
         }),
      ],
   },
   team: {
      fields: [
         f("email", "Email", "email", { required: true, max: 120 }),
         f("role", "Role", "enum", {
            options: ["admin", "support", "viewer"],
            default: "support",
         }),
         f("status", "Status", "enum", {
            options: ["invited", "active"],
            default: "invited",
            hidden: true,
         }),
      ],
   },
   subaccount: {
      fields: [
         f("name", "Name", "string", { required: true, max: 60 }),
         f("description", "Description", "string", { max: 200 }),
      ],
   },
   support: {
      fields: [
         f("email", "Customer email", "email", { required: true, max: 120 }),
         f("subject", "Subject", "string", { required: true, max: 120 }),
         f("message", "Message", "text", { max: 1000 }),
         f("status", "Status", "enum", {
            options: ["open", "closed"],
            default: "open",
            hidden: true,
         }),
      ],
   },
   waitlist: {
      fields: [
         f("feature", "Feature", "enum", {
            options: ["workforce", "cards"],
            required: true,
            hidden: true,
         }),
      ],
   },
};

export default kinds;
