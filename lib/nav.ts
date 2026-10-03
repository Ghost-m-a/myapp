import type { IconName } from "@/lib/client/icons";

export interface NavItem {
   path: string;
   name: string;
   icon: IconName;
   tag?: string;
   /** Explicit href override (defaults to "/" + path, "/" for home). */
   href?: string;
   arrow?: boolean;
}

export interface NavSection {
   label?: string;
   more?: boolean;
   items: NavItem[];
}

export interface Nav {
   sections: NavSection[];
   bottom: NavItem[];
}

const item = (
   path: string,
   name: string,
   icon: IconName,
   tag?: string,
   extra: Partial<NavItem> = {},
): NavItem => ({ path, name, icon, tag, ...extra });

const home = item("home", "Home", "home");
const messages = item("messages", "Messages", "messages");
const discover = item("discover", "Discover", "discover");
const affiliates = item("affiliates", "Affiliates", "affiliates");

const personalLinks: Record<string, NavItem[]> = {
   creator: [
      home,
      messages,
      item("townhall", "Townhall", "townhall"),
      item("partners", "Partners", "partners"),
      affiliates,
      discover,
   ],
   advertiser: [
      home,
      messages,
      item("campaigns", "Campaigns", "megaphone"),
      item("creators", "Creators", "creators"),
      item("analytics", "Analytics", "chart"),
      discover,
   ],
};

export function getNav({
   business = null,
   role = "creator",
}: {
   business?: { name: string } | null;
   role?: string;
} = {}): Nav {
   if (!business) {
      return {
         sections: [
            {
               label: "Personal",
               items: personalLinks[role] || personalLinks.creator,
            },
         ],
         bottom: [item("settings", "Settings", "settings")],
      };
   }

   return {
      sections: [
         {
            label: business.name,
            items: [
               home,
               item("analytics", "Analytics", "chart"),
               item("products", "Products", "box"),
               item("payments", "Payments", "card"),
               item("customers", "Customers", "users"),
               item("websites", "Websites", "globe", "New"),
            ],
         },
         {
            label: "Grow",
            items: [
               item("ads", "Ads", "megaphone"),
               item("workforce", "Workforce", "rocket", "Beta"),
               affiliates,
            ],
         },
         {
            label: "Operations",
            items: [item("cards", "Cards", "cards"), item("support", "Support", "support")],
         },
         {
            more: true,
            items: [
               item("reports", "Reports", "chart"),
               item("checkout", "Checkout links", "link"),
               item("invoices", "Invoices", "receipt"),
               item("promos", "Promo codes", "tag"),
               item("community", "Community", "townhall", undefined, {
                  href: "/townhall",
                  arrow: true,
               }),
               item("team", "Team", "users"),
               item("subaccounts", "Sub accounts", "briefcase"),
            ],
         },
         { label: "Apps", items: [item("apps", "Add", "plusCircle")] },
      ],
      bottom: [
         item("developer", "Developer", "code"),
         item("settings", "Settings", "settings"),
      ],
   };
}

/** Client-side href for a nav item. */
export const hrefFor = (i: NavItem): string =>
   i.href ?? (i.path === "home" ? "/" : `/${i.path}`);

export const flatItems = (nav: Nav): NavItem[] => [
   ...nav.sections.flatMap((s) => s.items),
   ...nav.bottom,
];

// Pages that exist in menus but not in a sidebar
const EXTRA: Record<string, string> = {
   billing: "Billing",
   resolution: "Resolution Center",
   orders: "Orders",
   help: "Help & Support",
   legal: "Legal",
   updates: "What's new",
   rewards: "Content Rewards",
};

export function titleFor(path: string): string | null {
   const all = [
      ...flatItems(getNav({ role: "creator" })),
      ...flatItems(getNav({ role: "advertiser" })),
      ...flatItems(getNav({ business: { name: "" } })),
   ];
   return all.find((i) => i.path === path)?.name || EXTRA[path] || null;
}
