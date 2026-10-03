"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { bus } from "@/lib/client/bus";
import { useSession } from "@/lib/client/store";
import { AreaChart } from "@/components/AreaChart";
import { Icon } from "@/lib/client/icons";
import type {
   BusinessDTO,
   BusinessWithOwner,
   CampaignDTO,
   ConversationDTO,
   MessageDTO,
   PubUser,
} from "@/lib/types";

type View =
   | "home"
   | "messages"
   | "campaigns"
   | "creators"
   | "analytics"
   | "discover";

interface AnalyticsData {
   summary: {
      campaigns: number;
      budget: number;
      participants: number;
      averageCpm: number;
   };
   series: {
      month: string;
      campaigns: number;
      budget: number;
      participants: number;
   }[];
   recent: {
      id: string;
      title: string;
      budget: number;
      participants: number;
      createdAt: string;
      business: string;
   }[];
}

interface DiscoverData {
   stats: { users: number; businesses: number; earned: number };
   businesses: BusinessWithOwner[];
}

const labels: Record<View, string> = {
   home: "Home",
   messages: "Messages",
   campaigns: "Campaigns",
   creators: "Creators",
   analytics: "Analytics",
   discover: "Discover",
};

const money = (value: number) =>
   new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
   }).format(value);

function Metric({
   label,
   value,
   icon,
}: {
   label: string;
   value: string | number;
   icon: "chart" | "megaphone" | "users" | "messages";
}) {
   return (
      <article className="panel market-metric">
         <span className="market-metric-icon">
            <Icon name={icon} />
         </span>
         <span className="market-metric-label">{label}</span>
         <strong>{value}</strong>
      </article>
   );
}

function UserRow({ user, action }: { user: PubUser; action: ReactNode }) {
   return (
      <article className="market-person">
         <span className="avatar market-avatar" aria-hidden="true">
            {user.avatar ? (
               <img src={user.avatar} alt="" />
            ) : (
               user.name.slice(0, 1).toUpperCase()
            )}
         </span>
         <div className="market-person-copy">
            <strong>{user.name}</strong>
            <span>
               @{user.username} ·{" "}
               {user.role === "creator" ? "Creator" : "Advertiser"}
            </span>
         </div>
         {action}
      </article>
   );
}

export function WorkspacePage({ view }: { view: View }) {
   const router = useRouter();
   const { user, businesses, ready } = useSession();
   const [query, setQuery] = useState("");
   const [people, setPeople] = useState<PubUser[]>([]);
   const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
   const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
   const [discovery, setDiscovery] = useState<DiscoverData | null>(null);
   const [conversations, setConversations] = useState<ConversationDTO[]>([]);
   const [selectedId, setSelectedId] = useState("");
   const [messages, setMessages] = useState<MessageDTO[]>([]);
   const [busy, setBusy] = useState(false);
   const [error, setError] = useState("");

   useEffect(() => {
      if (!user) return;
      let active = true;
      const requests: Promise<void>[] = [];
      if (["home", "analytics"].includes(view)) {
         requests.push(
            api<AnalyticsData>("/analytics").then((data) => {
               if (active) setAnalytics(data);
            }),
         );
      }
      if (["home", "campaigns", "discover"].includes(view)) {
         const campaignQuery =
            view === "discover" && query
               ? `?q=${encodeURIComponent(query)}`
               : "";
         requests.push(
            api<{ campaigns: CampaignDTO[] }>(
               `/campaigns${campaignQuery}`,
            ).then((data) => {
               if (active) setCampaigns(data.campaigns);
            }),
         );
      }
      if (view === "discover") {
         const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
         requests.push(
            api<DiscoverData>(`/discover${suffix}`).then((data) => {
               if (active) setDiscovery(data);
            }),
         );
      }
      if (view === "messages") {
         requests.push(
            api<{ conversations: ConversationDTO[] }>(
               "/messages/conversations",
            ).then((data) => {
               if (active) setConversations(data.conversations);
            }),
         );
      }
      Promise.all(requests).catch((err: unknown) => {
         if (active)
            setError((err as Error).message || "Could not load this page.");
      });
      return () => {
         active = false;
      };
   }, [view, user, query]);

   useEffect(() => {
      if (
         !user ||
         !["creators", "discover", "messages"].includes(view) ||
         query.trim().length < 2
      ) {
         setPeople([]);
         return;
      }
      let active = true;
      const timer = setTimeout(() => {
         const role = view === "creators" ? "&role=creator" : "";
         api<{ users: PubUser[] }>(
            `/discover/users?q=${encodeURIComponent(query.trim())}${role}`,
         )
            .then((data) => {
               if (active) setPeople(data.users);
            })
            .catch((err: unknown) => {
               if (active)
                  setError(
                     (err as Error).message || "Could not search people.",
                  );
            });
      }, 250);
      return () => {
         active = false;
         clearTimeout(timer);
      };
   }, [view, user, query]);

   useEffect(() => {
      if (view !== "messages") return;
      setSelectedId(
         new URLSearchParams(window.location.search).get("conversation") || "",
      );
   }, [view]);

   useEffect(() => {
      if (!user || view !== "messages") return;
      let active = true;
      const load = () =>
         api<{ conversations: ConversationDTO[] }>("/messages/conversations")
            .then((data) => {
               if (active) {
                  setConversations(data.conversations);
                  if (!selectedId && data.conversations[0])
                     setSelectedId(data.conversations[0].id);
               }
            })
            .catch((err: unknown) => {
               if (active)
                  setError(
                     (err as Error).message || "Could not load messages.",
                  );
            });
      load();
      const timer = setInterval(load, 10000);
      return () => {
         active = false;
         clearInterval(timer);
      };
   }, [view, user, selectedId]);

   useEffect(() => {
      if (!user || view !== "messages" || !selectedId) {
         setMessages([]);
         return;
      }
      let active = true;
      const load = () =>
         api<{ messages: MessageDTO[] }>(
            `/messages/conversations/${selectedId}`,
         )
            .then((data) => {
               if (active) setMessages(data.messages);
            })
            .catch((err: unknown) => {
               if (active)
                  setError(
                     (err as Error).message ||
                        "Could not load this conversation.",
                  );
            });
      load();
      const timer = setInterval(load, 6000);
      return () => {
         active = false;
         clearInterval(timer);
      };
   }, [view, user, selectedId]);

   async function startConversation(target: PubUser) {
      setError("");
      try {
         const { conversation } = await api<{ conversation: ConversationDTO }>(
            "/messages/conversations",
            {
               method: "POST",
               body: { userId: target.id },
            },
         );
         setConversations((current) => [
            conversation,
            ...current.filter((item) => item.id !== conversation.id),
         ]);
         setSelectedId(conversation.id);
         router.push(
            `/messages?conversation=${encodeURIComponent(conversation.id)}`,
         );
      } catch (err) {
         setError((err as Error).message);
      }
   }

   async function sendMessage(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!selectedId) return;
      const form = event.currentTarget;
      const data = new FormData(form);
      const text = String(data.get("text") || "").trim();
      if (!text) return;
      setBusy(true);
      setError("");
      try {
         await api(`/messages/conversations/${selectedId}`, {
            method: "POST",
            body: { text },
         });
         form.reset();
         const result = await api<{ messages: MessageDTO[] }>(
            `/messages/conversations/${selectedId}`,
         );
         setMessages(result.messages);
      } catch (err) {
         setError((err as Error).message);
      } finally {
         setBusy(false);
      }
   }

   async function createCampaign(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      setBusy(true);
      setError("");
      try {
         const result = await api<{ campaign: CampaignDTO }>("/campaigns", {
            method: "POST",
            body: {
               businessId: data.get("businessId"),
               title: data.get("title"),
               description: data.get("description"),
               category: data.get("category"),
               cpm: Number(data.get("cpm")),
               budget: Number(data.get("budget")),
               platforms: data.getAll("platform"),
            },
         });
         setCampaigns((current) => [result.campaign, ...current]);
         form.reset();
      } catch (err) {
         setError((err as Error).message);
      } finally {
         setBusy(false);
      }
   }

   async function joinCampaign(campaignId: string) {
      setBusy(true);
      setError("");
      try {
         await api(`/campaigns/${campaignId}/join`, { method: "POST" });
         setCampaigns((current) =>
            current.map((campaign) =>
               campaign.id === campaignId
                  ? {
                       ...campaign,
                       joined: true,
                       participants: campaign.participants + 1,
                    }
                  : campaign,
            ),
         );
      } catch (err) {
         setError((err as Error).message);
      } finally {
         setBusy(false);
      }
   }

   if (!ready)
      return (
         <div className="marketplace">
            <p className="muted">Loading your workspace...</p>
         </div>
      );
   if (!user) {
      return (
         <div className="marketplace">
            <PageHeading
               title={labels[view]}
               subtitle="Sign in to access your workspace."
            />
            <button
               className="btn btn-primary"
               onClick={() => bus.emit("auth:open", "login")}
            >
               Log in
            </button>
         </div>
      );
   }

   const unread = conversations.reduce(
      (total, conversation) => total + conversation.unread,
      0,
   );
   const selectedConversation = conversations.find(
      (conversation) => conversation.id === selectedId,
   );
   const subtitle =
      view === "home"
         ? `Good to see you, ${user.name.split(" ")[0]}. Here is what is happening in your workspace.`
         : view === "campaigns"
           ? user.role === "advertiser"
              ? "Publish campaigns and track creator participation."
              : "Find campaigns that fit your audience and join the ones you like."
           : view === "creators"
             ? "Search creator profiles and start a direct conversation."
             : view === "analytics"
               ? "Performance from campaigns stored in your workspace."
               : view === "discover"
                 ? "Explore businesses, campaigns, and people across the network."
                 : "Your conversations, updated from the live message service.";

   return (
      <div className="marketplace">
         <PageHeading title={labels[view]} subtitle={subtitle} />
         {error && (
            <p className="market-alert" role="alert">
               {error}
            </p>
         )}
         {view === "home" && (
            <>
               <div className="market-metrics">
                  <Metric
                     label="Campaigns"
                     value={analytics?.summary.campaigns ?? 0}
                     icon="megaphone"
                  />
                  <Metric
                     label={
                        user.role === "creator"
                           ? "Joined campaigns"
                           : "Creator signups"
                     }
                     value={analytics?.summary.participants ?? 0}
                     icon="users"
                  />
                  <Metric
                     label={
                        user.role === "creator"
                           ? "Available campaigns"
                           : "Planned budget"
                     }
                     value={
                        user.role === "creator"
                           ? campaigns.length
                           : money(analytics?.summary.budget ?? 0)
                     }
                     icon="chart"
                  />
                  <Metric
                     label="Unread messages"
                     value={unread}
                     icon="messages"
                  />
               </div>
               <div className="market-columns">
                  <section className="panel">
                     <div className="market-section-heading">
                        <h2>Recent campaigns</h2>
                        <Link href="/campaigns">View all</Link>
                     </div>
                     {campaigns.length ? (
                        campaigns
                           .slice(0, 4)
                           .map((campaign) => (
                              <CampaignRow
                                 key={campaign.id}
                                 campaign={campaign}
                              />
                           ))
                     ) : (
                        <EmptyMessage>
                           No campaigns yet. Discover the network or publish
                           your first campaign.
                        </EmptyMessage>
                     )}
                  </section>
                  <section className="panel">
                     <div className="market-section-heading">
                        <h2>Quick links</h2>
                     </div>
                     <nav className="market-quick-links">
                        <Link href="/discover">
                           <Icon name="discover" /> Explore the network
                        </Link>
                        <Link href="/messages">
                           <Icon name="messages" /> Open messages{" "}
                           {unread > 0 && <span>{unread}</span>}
                        </Link>
                        {user.role === "advertiser" && (
                           <button onClick={() => bus.emit("business:new")}>
                              <Icon name="plusCircle" /> Create a business
                           </button>
                        )}
                     </nav>
                  </section>
               </div>
            </>
         )}

         {view === "campaigns" && (
            <>
               {user.role === "advertiser" && (
                  <section className="panel market-create">
                     <div className="market-section-heading">
                        <h2>Publish a campaign</h2>
                     </div>
                     {businesses.length === 0 ? (
                        <div className="market-empty-inline">
                           <p>Create a business workspace before publishing.</p>
                           <button
                              className="btn btn-primary"
                              onClick={() => bus.emit("business:new")}
                           >
                              Create business
                           </button>
                        </div>
                     ) : (
                        <form className="market-form" onSubmit={createCampaign}>
                           <label className="field">
                              Business
                              <select
                                 name="businessId"
                                 required
                                 defaultValue={businesses[0].id}
                              >
                                 {businesses.map((business: BusinessDTO) => (
                                    <option
                                       key={business.id}
                                       value={business.id}
                                    >
                                       {business.name}
                                    </option>
                                 ))}
                              </select>
                           </label>
                           <label className="field">
                              Campaign title
                              <input
                                 name="title"
                                 minLength={3}
                                 maxLength={80}
                                 required
                                 placeholder="A clear, specific campaign title"
                              />
                           </label>
                           <label className="field">
                              Description
                              <textarea
                                 name="description"
                                 maxLength={500}
                                 rows={3}
                                 placeholder="What should creators make or share?"
                              />
                           </label>
                           <div className="market-form-row">
                              <label className="field">
                                 Category
                                 <input
                                    name="category"
                                    maxLength={40}
                                    placeholder="Lifestyle, technology..."
                                 />
                              </label>
                              <label className="field">
                                 CPM (USD)
                                 <input
                                    name="cpm"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                 />
                              </label>
                              <label className="field">
                                 Budget (USD)
                                 <input
                                    name="budget"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                 />
                              </label>
                           </div>
                           <fieldset className="market-platforms">
                              <legend>Platforms</legend>
                              {[
                                 "Instagram",
                                 "TikTok",
                                 "YouTube",
                                 "Twitch",
                                 "Other",
                              ].map((platform) => (
                                 <label key={platform}>
                                    <input
                                       type="checkbox"
                                       name="platform"
                                       value={platform.toLowerCase()}
                                    />
                                    {platform}
                                 </label>
                              ))}
                           </fieldset>
                           <button
                              className="btn btn-primary"
                              type="submit"
                              disabled={busy}
                           >
                              {busy ? "Publishing..." : "Publish campaign"}
                           </button>
                        </form>
                     )}
                  </section>
               )}
               <section className="market-campaign-list">
                  <div className="market-section-heading">
                     <h2>
                        {user.role === "advertiser"
                           ? "Your campaigns"
                           : "Open campaigns"}
                     </h2>
                     <span className="market-count">{campaigns.length}</span>
                  </div>
                  {campaigns.length ? (
                     campaigns.map((campaign) => (
                        <article
                           className="panel market-campaign"
                           key={campaign.id}
                        >
                           <div className="market-section-heading">
                              <div>
                                 <span className="market-eyebrow">
                                    {campaign.category} ·{" "}
                                    {campaign.platforms.join(", ")}
                                 </span>
                                 <h3>{campaign.title}</h3>
                              </div>
                              {campaign.joined && (
                                 <span className="market-status">Joined</span>
                              )}
                           </div>
                           <p>
                              {campaign.description ||
                                 "No additional description provided."}
                           </p>
                           <div className="market-campaign-meta">
                              <span>
                                 {campaign.business?.name || "Business"}
                              </span>
                              <span>{money(campaign.budget)} budget</span>
                              <span>{money(campaign.cpm)} CPM</span>
                              <span>{campaign.participants} joined</span>
                           </div>
                           {user.role === "creator" && (
                              <button
                                 className="btn btn-primary"
                                 disabled={busy || campaign.joined}
                                 onClick={() => joinCampaign(campaign.id)}
                              >
                                 {campaign.joined ? "Joined" : "Join campaign"}
                              </button>
                           )}
                        </article>
                     ))
                  ) : (
                     <div className="panel">
                        <EmptyMessage>
                           {user.role === "advertiser"
                              ? "No campaigns published yet."
                              : "There are no open campaigns to show yet."}
                        </EmptyMessage>
                     </div>
                  )}
               </section>
            </>
         )}

         {view === "creators" && (
            <section className="panel">
               <label className="market-search">
                  <Icon name="search" />
                  <input
                     value={query}
                     onChange={(event) => setQuery(event.target.value)}
                     placeholder="Search creators by name or username"
                  />
               </label>
               {query.trim().length < 2 ? (
                  <EmptyMessage>
                     Enter at least 2 characters to search creator profiles.
                  </EmptyMessage>
               ) : people.length ? (
                  people.map((person) => (
                     <UserRow
                        key={person.id}
                        user={person}
                        action={
                           <button
                              className="btn btn-outline"
                              onClick={() => startConversation(person)}
                           >
                              Message
                           </button>
                        }
                     />
                  ))
               ) : (
                  <EmptyMessage>No creators match this search.</EmptyMessage>
               )}
            </section>
         )}

         {view === "analytics" && (
            <>
               <div className="market-metrics">
                  <Metric
                     label="Campaigns"
                     value={analytics?.summary.campaigns ?? 0}
                     icon="megaphone"
                  />
                  <Metric
                     label="Creator participation"
                     value={analytics?.summary.participants ?? 0}
                     icon="users"
                  />
                  <Metric
                     label={
                        user.role === "creator"
                           ? "Campaign budget represented"
                           : "Planned campaign budget"
                     }
                     value={money(analytics?.summary.budget ?? 0)}
                     icon="chart"
                  />
                  <Metric
                     label="Average CPM"
                     value={money(analytics?.summary.averageCpm ?? 0)}
                     icon="chart"
                  />
               </div>
               <section className="panel">
                  <div className="market-section-heading">
                     <h2>Monthly campaign activity</h2>
                     <span className="market-count">
                        Last {analytics?.series.length ?? 0} active months
                     </span>
                  </div>
                  {analytics?.series.length ? (
                     <>
                        <AreaChart
                           values={analytics.series.map(
                              (point) => point.participants,
                           )}
                        />
                        <div className="market-series">
                           {analytics.series.map((point) => (
                              <span key={point.month}>
                                 <strong>
                                    {new Date(
                                       `${point.month}-01`,
                                    ).toLocaleDateString(undefined, {
                                       month: "short",
                                       year: "2-digit",
                                    })}
                                 </strong>
                                 {point.campaigns} campaigns ·{" "}
                                 {point.participants} joined ·{" "}
                                 {money(point.budget)}
                              </span>
                           ))}
                        </div>
                     </>
                  ) : (
                     <EmptyMessage>
                        Campaign activity will appear here when campaigns are
                        created or joined.
                     </EmptyMessage>
                  )}
               </section>
               <section className="panel">
                  <div className="market-section-heading">
                     <h2>Recent activity</h2>
                  </div>
                  {analytics?.recent.length ? (
                     analytics.recent.map((campaign) => (
                        <CampaignRow
                           key={campaign.id}
                           campaign={{
                              ...campaign,
                              description: "",
                              category: "Campaign",
                              cpm: 0,
                              spent: 0,
                              platforms: [],
                              joined: false,
                              mine: false,
                              business: { id: "", name: campaign.business },
                           }}
                        />
                     ))
                  ) : (
                     <EmptyMessage>No campaign records yet.</EmptyMessage>
                  )}
               </section>
            </>
         )}

         {view === "discover" && (
            <>
               <div className="market-metrics market-discover-stats">
                  <Metric
                     label="Members"
                     value={discovery?.stats.users ?? 0}
                     icon="users"
                  />
                  <Metric
                     label="Businesses"
                     value={discovery?.stats.businesses ?? 0}
                     icon="chart"
                  />
                  <Metric
                     label="Campaigns"
                     value={campaigns.length}
                     icon="megaphone"
                  />
               </div>
               <section className="panel">
                  <label className="market-search">
                     <Icon name="search" />
                     <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search businesses, campaigns, and people"
                     />
                  </label>
                  <div className="market-section-heading">
                     <h2>People</h2>
                  </div>
                  {query.trim().length < 2 ? (
                     <EmptyMessage>
                        Enter at least 2 characters to find people.
                     </EmptyMessage>
                  ) : people.length ? (
                     people.map((person) => (
                        <UserRow
                           key={person.id}
                           user={person}
                           action={
                              <button
                                 className="btn btn-outline"
                                 onClick={() => startConversation(person)}
                              >
                                 Message
                              </button>
                           }
                        />
                     ))
                  ) : (
                     <p className="muted">No people match this search.</p>
                  )}
               </section>
               <section className="panel">
                  <div className="market-section-heading">
                     <h2>Businesses</h2>
                  </div>
                  {discovery?.businesses.length ? (
                     discovery.businesses.map((business) => (
                        <article className="market-business" key={business.id}>
                           <div>
                              <h3>{business.name}</h3>
                              <p>
                                 {business.description ||
                                    "A business on the creator network."}
                              </p>
                           </div>
                           <span>
                              {business.owner?.name || "Network member"}
                           </span>
                        </article>
                     ))
                  ) : (
                     <EmptyMessage>No businesses are listed yet.</EmptyMessage>
                  )}
               </section>
               <section className="panel">
                  <div className="market-section-heading">
                     <h2>Campaigns</h2>
                     <Link href="/campaigns">View all</Link>
                  </div>
                  {campaigns.length ? (
                     campaigns
                        .slice(0, 5)
                        .map((campaign) => (
                           <CampaignRow key={campaign.id} campaign={campaign} />
                        ))
                  ) : (
                     <EmptyMessage>
                        No campaigns are available yet.
                     </EmptyMessage>
                  )}
               </section>
            </>
         )}

         {view === "messages" && (
            <div className="market-messages">
               <aside className="panel market-inbox">
                  <h2>Inbox</h2>
                  <label className="market-search">
                     <Icon name="search" />
                     <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Find someone to message"
                     />
                  </label>
                  {query.trim().length >= 2 &&
                     people.map((person) => (
                        <UserRow
                           key={person.id}
                           user={person}
                           action={
                              <button
                                 className="icon-btn"
                                 aria-label={`Message ${person.name}`}
                                 onClick={() => startConversation(person)}
                              >
                                 <Icon name="send" />
                              </button>
                           }
                        />
                     ))}
                  <div className="market-conversation-list">
                     {conversations.map((conversation) => (
                        <button
                           className={`market-conversation${selectedId === conversation.id ? " selected" : ""}`}
                           key={conversation.id}
                           onClick={() => setSelectedId(conversation.id)}
                        >
                           <strong>
                              {conversation.other?.name || "Deleted account"}
                           </strong>
                           <span>
                              {conversation.lastMessage ||
                                 "Start the conversation"}
                           </span>
                           {conversation.unread > 0 && (
                              <b>{conversation.unread}</b>
                           )}
                        </button>
                     ))}
                  </div>
               </aside>
               <section className="panel market-chat">
                  {selectedConversation ? (
                     <>
                        <header className="market-chat-header">
                           <div>
                              <h2>
                                 {selectedConversation.other?.name ||
                                    "Conversation"}
                              </h2>
                              <span>
                                 @{selectedConversation.other?.username || ""}
                              </span>
                           </div>
                        </header>
                        <div className="market-message-log" aria-live="polite">
                           {messages.map((message) => (
                              <p
                                 className={`market-message${message.sender === user.id ? " mine" : ""}`}
                                 key={message.id}
                              >
                                 {message.text}
                                 <time>
                                    {new Date(
                                       message.createdAt,
                                    ).toLocaleTimeString([], {
                                       hour: "numeric",
                                       minute: "2-digit",
                                    })}
                                 </time>
                              </p>
                           ))}
                        </div>
                        <form className="market-compose" onSubmit={sendMessage}>
                           <input
                              name="text"
                              maxLength={2000}
                              placeholder="Write a message..."
                              autoComplete="off"
                              required
                           />
                           <button
                              className="btn btn-primary"
                              aria-label="Send message"
                              disabled={busy}
                           >
                              <Icon name="send" />
                           </button>
                        </form>
                     </>
                  ) : (
                     <EmptyMessage>
                        Choose a conversation or search for someone to message.
                     </EmptyMessage>
                  )}
               </section>
            </div>
         )}
      </div>
   );
}

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
   return (
      <header className="market-heading">
         <div>
            <span className="market-eyebrow">WORKSPACE</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
         </div>
      </header>
   );
}

function EmptyMessage({ children }: { children: ReactNode }) {
   return <p className="market-empty">{children}</p>;
}

function CampaignRow({ campaign }: { campaign: CampaignDTO }) {
   return (
      <article className="market-campaign-row">
         <div>
            <h3>{campaign.title}</h3>
            <p>
               {campaign.business?.name || "Campaign"} · {campaign.participants}{" "}
               joined
            </p>
         </div>
         <strong>{money(campaign.budget)}</strong>
      </article>
   );
}
