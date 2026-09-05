'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAgentFeed, AgentEvent } from '@/hooks/useAgentFeed';
import Sidebar, { SessionItem } from '@/components/Sidebar';
import SettingsTab from '@/components/SettingsTab';
import OrdersTab from '@/components/OrdersTab';
import ActivityCanvas from '@/components/ActivityCanvas';
import MandateVaultModal, { MandateRecord } from '@/components/MandateVaultModal';
import { UserProfile, GUEST_USER } from '@/components/GoogleAuthButton';
import NotificationModal, { NotificationOptions, NotificationType } from '@/components/NotificationModal';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '/api/events';

type ChatMessage = {
  id: string;
  sender: 'human' | 'agent';
  role?: 'user' | 'assistant' | string;
  text: string;
  timestamp: string;
  orderId?: string;
  amountDisplay?: string;
  gateTier?: string;
  isTier1?: boolean;
  isRecommended?: boolean;
  product?: {
    id?: string;
    name: string;
    brand?: string;
    priceDisplay?: string;
    imageUrl?: string;
    merchantUrl?: string;
    productUrl?: string;
    reasoning?: string;
  };
  upsell?: {
    name: string;
    discount: string;
    bundlePrice: string;
    originalPrice?: string;
  };
};

function renderInlineMarkdown(text: string, isLight: boolean) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
          {inner}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic font-medium">
          {inner}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      const inner = part.slice(1, -1);
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">
          {inner}
        </code>
      );
    }
    return part;
  });
}

function FormattedMarkdown({ content, isLight }: { content: string; isLight: boolean }) {
  if (!content) return null;
  const paragraphs = content.split(/\n\n+/);
  return (
    <div className="space-y-2">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split(/\n/);
        return (
          <p key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderInlineMarkdown(line, isLight)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

const DEFAULT_URBANSTRIDE_URL =
  process.env.NEXT_PUBLIC_URBANSTRIDE_URL || 'http://localhost:3001';
const DEFAULT_TECHCART_URL =
  process.env.NEXT_PUBLIC_TECHCART_URL || 'http://localhost:3002';

function formatStorefrontUrl(
  pUrl: string | undefined,
  pId: string | undefined,
  merchUrl: string = DEFAULT_URBANSTRIDE_URL
) {
  if (pUrl && (pUrl.startsWith('http://') || pUrl.startsWith('https://'))) {
    return pUrl;
  }
  if (pUrl && pUrl.startsWith('/')) {
    return `${merchUrl}${pUrl}`;
  }
  if (pId) {
    return `${merchUrl}/product/${pId}`;
  }
  return `${merchUrl}/products`;
}

function deduplicateEvents(events: AgentEvent[]): AgentEvent[] {
  const result: AgentEvent[] = [];
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const ev of sorted) {
    const evTime = new Date(ev.timestamp).getTime();
    const duplicateIdx = result.findIndex((existing) => {
      if (existing.id === ev.id) return true;
      if (existing.session_id === ev.session_id && existing.type === ev.type) {
        const diff = Math.abs(new Date(existing.timestamp).getTime() - evTime);
        return diff < 3000;
      }
      return false;
    });

    if (duplicateIdx === -1) {
      result.push(ev);
    }
  }
  return result;
}

function buildMessagesFromSessionEvents(
  sessEvents: AgentEvent[],
  storedHumanMessages: ChatMessage[] = []
): ChatMessage[] {
  const dedupedEvents = deduplicateEvents(sessEvents);
  const allMessages: ChatMessage[] = [];
  const emittedKeys = new Set<string>();

  for (const ev of dedupedEvents) {
    let out = ev.output_data;
    if (typeof out === 'string') {
      try {
        out = JSON.parse(out);
      } catch {}
    }
    out = (out || {}) as Record<string, any>;

    let inp = ev.input_data;
    if (typeof inp === 'string') {
      try {
        inp = JSON.parse(inp);
      } catch {}
    }
    inp = (inp || {}) as Record<string, any>;

    if (!out.reply && inp.output_data) {
      if (typeof inp.output_data === 'object') {
        out = { ...out, ...inp.output_data };
      } else if (typeof inp.output_data === 'string') {
        try {
          out = { ...out, ...JSON.parse(inp.output_data) };
        } catch {}
      }
    }

    let text = '';
    let orderId: string | undefined;
    let amountDisplay: string | undefined;
    let gateTier: string | undefined;
    let isTier1: boolean = false;
    let isRecommended: boolean = false;
    let productData: ChatMessage['product'] = undefined;
    let upsellData: ChatMessage['upsell'] = undefined;

    switch (ev.type) {
      case 'INSTRUCTION_PARSED': {
        const prompt =
          (inp.instruction as string) ||
          (ev.instruction as string) ||
          '';

        if (prompt) {
          const humanKey = `human_${prompt.trim().toLowerCase()}`;
          if (!emittedKeys.has(humanKey)) {
            emittedKeys.add(humanKey);
            allMessages.push({
              id: `h_${ev.id || ev.timestamp}`,
              sender: 'human',
              text: prompt,
              timestamp: new Date(new Date(ev.timestamp).getTime() - 200).toISOString(),
            });
          }
        }

        const size = out.required_size || inp.required_size || ev.required_size || 'any';
        const budget = out.budget_max_paise ?? inp.budget_max_paise ?? ev.budget_max_paise;
        const budgetStr = budget ? `₹${(budget / 100).toLocaleString('en-IN')}` : 'unlimited';
        text = `Parsed your request. Searching federated catalogs for size "${size}" within budget ${budgetStr}.`;
        break;
      }
      case 'PRODUCT_RECOMMENDED':
      case 'PRODUCT_SELECTED': {
        const name = out.selected_name || out.recommended_name || out.product?.name || ev.selected_name || 'selected item';
        const brand = out.brand || out.product?.brand || ev.brand || '';
        const price =
          out.price?.display ||
          out.product?.price?.display ||
          (out.price_inr ? `₹${out.price_inr}` : '') ||
          ev.price?.display ||
          '';
        const img = out.image_url || out.product?.image_url || ev.image_url || '';
        const merchUrl = out.merchant_url || (name.toLowerCase().includes('shoe') || name.toLowerCase().includes('hrx') ? DEFAULT_URBANSTRIDE_URL : DEFAULT_TECHCART_URL);
        const pId = out.selected_id || out.recommended_id || inp.product_id || ev.product_id || (name.toLowerCase().includes('hrx') ? 'urbanstride_hrx_run' : '');
        const pUrl = formatStorefrontUrl(out.product_url, pId, merchUrl);
        text = out.reply || ev.reasoning || `Recommended "${name}"${brand ? ` by ${brand}` : ''}${price ? ` — ${price}` : ''} as the best match.`;
        isRecommended = true;

        const offers = Array.isArray(out.offers) && out.offers.length > 0 ? out.offers[0] : (out.product?.offers?.[0] || null);
        if (offers) {
          upsellData = {
            name: offers.name,
            discount: offers.discount || 'Bundle Deal',
            bundlePrice: offers.bundle_price_paise ? `+₹${offers.bundle_price_paise / 100}` : 'Special Bundle',
            originalPrice: offers.original_price_paise ? `₹${offers.original_price_paise / 100}` : undefined,
          };
        }

        productData = {
          id: pId,
          name,
          brand,
          priceDisplay: price,
          imageUrl: img,
          merchantUrl: merchUrl,
          productUrl: pUrl,
          reasoning: ev.reasoning,
        };
        break;
      }
      case 'GATE_CHECKED': {
        const tier = inp.tier || out.tier || ev.tier || 'NOTIFY';
        const reason = ev.reasoning || inp.description || 'Spend policy verified.';
        text = `Spend gate evaluated: "${tier}" tier. ${reason}`;
        break;
      }
      case 'ORDER_CREATED': {
        orderId = out.razorpay_order_id || inp.razorpay_order_id || ev.razorpay_order_id || ev.order_id || '';
        amountDisplay =
          out.amount?.display ||
          (out.amount?.inr ? `₹${out.amount.inr}` : '') ||
          (ev.amount_inr ? `₹${ev.amount_inr}` : '');
        gateTier = out.gate_tier || inp.gate_tier || '';
        const amountPaise =
          out.amount?.paise || inp.amount_paise || (out.amount?.inr ? parseFloat(out.amount.inr) * 100 : 0);
        isTier1 = gateTier === 'AUTO' || (amountPaise > 0 && amountPaise <= 150000);
        const name = out.product_name || inp.product_name || ev.product_name || '';
        const brand = out.brand || '';
        const img = out.image_url || inp.image_url || out.product?.image_url || (name.toLowerCase().includes('shoe') || name.toLowerCase().includes('hrx') ? `${DEFAULT_URBANSTRIDE_URL}/assets/urbanstride/shoe1.png` : '');
        const merchUrl = out.merchant_url || (name.toLowerCase().includes('shoe') || name.toLowerCase().includes('hrx') ? DEFAULT_URBANSTRIDE_URL : DEFAULT_TECHCART_URL);
        const pId = out.product_id || inp.product_id || ev.product_id || (name.toLowerCase().includes('hrx') ? 'urbanstride_hrx_run' : '');
        const pUrl = formatStorefrontUrl(out.product_url, pId, merchUrl);
        if (name) {
          productData = {
            id: pId,
            name,
            brand,
            priceDisplay: amountDisplay,
            imageUrl: img,
            merchantUrl: merchUrl,
            productUrl: pUrl,
          };
        }
        text = isTier1
          ? `Created Razorpay Order "${orderId}"${amountDisplay ? ` for ${amountDisplay}` : ''}. Pre-cleared for 1-Click Mandate buy.`
          : `Created Razorpay Order "${orderId}"${amountDisplay ? ` for ${amountDisplay}` : ''}. Requires 2FA authorization.`;
        break;
      }
      case 'UPSELL_OFFERED': {
        const item = inp.upsell_item || out.upsell_item || ev.upsell_item || 'Accessory';
        const price = inp.bundle_price || out.bundle_price || '';
        const disc = out.discount || '';
        text = `Frequently bought together: Would you like to add "${item}" ${disc ? `(${disc}) ` : ''}for ${price}?`;
        upsellData = {
          name: item,
          discount: disc,
          bundlePrice: price,
          originalPrice: out.original_price,
        };
        break;
      }
      case 'CLARIFICATION_REQUESTED':
      case 'CONVERSATIONAL_REPLIED':
      case 'GREETING_RESPONDED': {
        const prompt = (inp.instruction as string) || (ev.instruction as string) || '';
        if (prompt) {
          const humanKey = `human_${prompt.trim().toLowerCase()}`;
          if (!emittedKeys.has(humanKey)) {
            emittedKeys.add(humanKey);
            allMessages.push({
              id: `h_${ev.id || ev.timestamp}`,
              sender: 'human',
              text: prompt,
              timestamp: new Date(new Date(ev.timestamp).getTime() - 200).toISOString(),
            });
          }
        }
        text =
          (out.reply as string) ||
          ev.reasoning ||
          "Hello! I'm your CatalogX autonomous shopping assistant powered by Razorpay. What products are you looking to buy today?";
        break;
      }
      case 'SEARCH_NO_RESULTS': {
        text =
          ev.reasoning ||
          `I couldn't find matching products for "${inp.query || inp.instruction || 'your query'}". Try asking for running shoes, earbuds, or mechanical keyboards!`;
        break;
      }
      case 'PAYMENT_VERIFIED':
      case 'PAYMENT_CAPTURED': {
        const payId = out.razorpay_payment_id || inp.razorpay_payment_id || ev.razorpay_payment_id || '';
        text = `Cryptographic Payment Verified! Captured Transaction ID: "${payId}". Order marked as PAID.`;
        break;
      }
      case 'AGENT_ERROR':
      case 'PURCHASE_FAILED': {
        text = ev.reasoning || out.error || 'Failed to complete order.';
        break;
      }
      default:
        break;
    }

    if (text) {
      const agentKey = `agent_${text.trim().toLowerCase()}`;
      if (!emittedKeys.has(agentKey)) {
        emittedKeys.add(agentKey);
        allMessages.push({
          id: `msg_${ev.id || ev.timestamp}_${ev.type}`,
          sender: 'agent',
          text,
          timestamp: ev.timestamp,
          orderId,
          amountDisplay,
          gateTier,
          isTier1,
          isRecommended,
          product: productData,
          upsell: upsellData,
        });
      }
    }
  }

  for (const h of storedHumanMessages) {
    const sender = h.sender || ((h as any).role === 'assistant' ? 'agent' : 'human');
    const msgText = h.text || '';
    const key = `${sender}_${msgText.trim().toLowerCase()}`;
    if (msgText && !emittedKeys.has(key)) {
      emittedKeys.add(key);
      allMessages.push({
        ...h,
        sender,
      });
    }
  }

  return allMessages.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export default function Dashboard() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const eventUrl = activeSessionId ? `/api/events?sessionId=${encodeURIComponent(activeSessionId)}` : '/api/events';
  const { events, wsState, refreshEvents } = useAgentFeed(eventUrl);
  const [selectedEvent, setSelectedEvent] = useState<AgentEvent | null>(null);
  const [sessionTitles, setSessionTitles] = useState<Record<string, string>>({});
  const [deletedSessionIds, setDeletedSessionIds] = useState<string[]>([]);
  const [humanMessagesBySession, setHumanMessagesBySession] = useState<Record<string, ChatMessage[]>>({});

  // Theme & Navigation Tabs
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'chat' | 'orders' | 'settings'>('chat');
  const [isActivityCanvasOpen, setIsActivityCanvasOpen] = useState(false);

  // Mandate & User Profile State
  const [activeMandate, setActiveMandate] = useState<MandateRecord | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isCapturingMandate, setIsCapturingMandate] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(GUEST_USER);
  const [acceptedUpsells, setAcceptedUpsells] = useState<Record<string, boolean>>({});

  // Notification Modal State
  const [notification, setNotification] = useState<NotificationOptions | null>(null);

  const showAlert = (options: NotificationOptions | string, type: NotificationType = 'info') => {
    if (typeof options === 'string') {
      setNotification({ message: options, type });
    } else {
      setNotification(options);
    }
  };

  // Chat inputs
  const [chatInput, setChatInput] = useState('');
  const [isSpawning, setIsSpawning] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Load state from localStorage on mount & fetch server mandate status
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('catalogx_theme') as 'light' | 'dark' | null;
      if (storedTheme) setTheme(storedTheme);

      const storedTitles = localStorage.getItem('catalogx_session_titles');
      if (storedTitles) setSessionTitles(JSON.parse(storedTitles));

      const storedDeleted = localStorage.getItem('catalogx_deleted_sessions');
      if (storedDeleted) setDeletedSessionIds(JSON.parse(storedDeleted));

      const storedHumanMsgs = localStorage.getItem('catalogx_human_msgs');
      if (storedHumanMsgs) setHumanMessagesBySession(JSON.parse(storedHumanMsgs));

      const storedUser = localStorage.getItem('catalogx_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserProfile(parsedUser);

        if (parsedUser.isLoggedIn) {
          // 1. Fetch mandate status
          fetch('/api/mandates/status')
            .then((res) => res.json())
            .then((data) => {
              if (data && data.active && data.mandate) {
                setActiveMandate(data.mandate);
              }
            })
            .catch(() => {});

          // 2. Fetch synced profile from MongoDB
          if (parsedUser.email) {
            fetch(`/api/users/profile?email=${encodeURIComponent(parsedUser.email)}`)
              .then((r) => r.json())
              .then((d) => {
                const p = d?.user || d?.profile;
                if (p) {
                  setUserProfile((prev) => {
                    const merged = { ...prev, ...p, isLoggedIn: true };
                    localStorage.setItem('catalogx_user', JSON.stringify(merged));
                    return merged;
                  });
                }
              })
              .catch(() => {});

            // 3. Fetch past sessions from MongoDB Atlas
            fetch(`/api/sessions?email=${encodeURIComponent(parsedUser.email)}`)
              .then((r) => r.json())
              .then((d) => {
                if (d && d.sessions && d.sessions.length > 0) {
                  const titles: Record<string, string> = {};
                  const msgsMap: Record<string, ChatMessage[]> = {};
                  for (const s of d.sessions) {
                    if (s.sessionId && s.title) {
                      titles[s.sessionId] = s.title;
                    }
                    if (s.sessionId && Array.isArray(s.messages)) {
                      msgsMap[s.sessionId] = s.messages;
                    }
                  }
                  setSessionTitles((prev) => ({ ...prev, ...titles }));
                  setHumanMessagesBySession((prev) => ({ ...prev, ...msgsMap }));
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('catalogx_theme', nextTheme);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Extract all distinct sessions sorted with most recent chat at the top
  const discoveredSessions = React.useMemo(() => {
    const map = new Map<string, { id: string; lastSeen: string; firstSeen: string; count: number }>();
    for (const ev of events) {
      if (!ev.session_id) continue;
      const existing = map.get(ev.session_id);
      if (!existing) {
        map.set(ev.session_id, { id: ev.session_id, lastSeen: ev.timestamp, firstSeen: ev.timestamp, count: 1 });
      } else {
        existing.count += 1;
        if (new Date(ev.timestamp).getTime() > new Date(existing.lastSeen).getTime()) {
          existing.lastSeen = ev.timestamp;
        }
      }
    }
    for (const [sId, msgs] of Object.entries(humanMessagesBySession)) {
      if (msgs && msgs.length > 0) {
        const lastMsgTime = msgs[msgs.length - 1].timestamp;
        const existing = map.get(sId);
        if (existing) {
          if (new Date(lastMsgTime).getTime() > new Date(existing.lastSeen).getTime()) {
            existing.lastSeen = lastMsgTime;
          }
        } else {
          map.set(sId, { id: sId, lastSeen: lastMsgTime, firstSeen: lastMsgTime, count: msgs.length });
        }
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }, [events, humanMessagesBySession]);

  useEffect(() => {
    if (!activeSessionId && discoveredSessions.length > 0) {
      const firstValid = discoveredSessions.find((s) => !deletedSessionIds.includes(s.id));
      if (firstValid) setActiveSessionId(firstValid.id);
    }
  }, [discoveredSessions, activeSessionId, deletedSessionIds]);

  const activeSessionEvents = React.useMemo(() => {
    if (!activeSessionId) return [];
    return events.filter((e) => e.session_id === activeSessionId);
  }, [events, activeSessionId]);

  const currentStoredHuman = React.useMemo(() => {
    if (!activeSessionId) return [];
    return humanMessagesBySession[activeSessionId] || [];
  }, [humanMessagesBySession, activeSessionId]);

  const currentMessages = React.useMemo(() => {
    return buildMessagesFromSessionEvents(activeSessionEvents, currentStoredHuman);
  }, [activeSessionEvents, currentStoredHuman]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  const sessionList: SessionItem[] = React.useMemo(() => {
    const list = discoveredSessions
      .filter((s) => !deletedSessionIds.includes(s.id))
      .map((s) => ({
        id: s.id,
        title: sessionTitles[s.id] || 'New Chat',
        createdAt: s.lastSeen,
        eventCount: s.count,
      }));

    // If activeSessionId is not in list yet (e.g. freshly created "New Chat"), put it at the very top!
    if (
      activeSessionId &&
      !deletedSessionIds.includes(activeSessionId) &&
      !list.some((s) => s.id === activeSessionId)
    ) {
      list.unshift({
        id: activeSessionId,
        title: sessionTitles[activeSessionId] || 'New Chat',
        createdAt: new Date().toISOString(),
        eventCount: 0,
      });
    }

    return list;
  }, [discoveredSessions, deletedSessionIds, sessionTitles, activeSessionId]);

  const handleNewSession = () => {
    const newId = `sess_${Math.random().toString(36).substring(2, 9)}`;
    setSessionTitles((prev) => {
      const updated = { ...prev, [newId]: 'New Chat' };
      localStorage.setItem('catalogx_session_titles', JSON.stringify(updated));
      return updated;
    });
    setActiveSessionId(newId);
    setActiveTab('chat');
  };

  const handleDeleteSession = (id: string) => {
    const updated = [...deletedSessionIds, id];
    setDeletedSessionIds(updated);
    localStorage.setItem('catalogx_deleted_sessions', JSON.stringify(updated));

    // Clean up local storage titles and messages
    setSessionTitles((prev) => {
      const copy = { ...prev };
      delete copy[id];
      localStorage.setItem('catalogx_session_titles', JSON.stringify(copy));
      return copy;
    });

    setHumanMessagesBySession((prev) => {
      const copy = { ...prev };
      delete copy[id];
      localStorage.setItem('catalogx_human_msgs', JSON.stringify(copy));
      return copy;
    });

    // Delete from MongoDB Atlas & local logs
    fetch(`/api/sessions?sessionId=${encodeURIComponent(id)}${userProfile.email ? `&email=${encodeURIComponent(userProfile.email)}` : ''}`, {
      method: 'DELETE',
    }).catch(() => {});

    if (activeSessionId === id) {
      const remaining = discoveredSessions.find((s) => s.id !== id && !updated.includes(s.id));
      setActiveSessionId(remaining ? remaining.id : null);
    }
  };

  const hasCompleteDelivery = !!(userProfile.isLoggedIn && userProfile.phone && userProfile.delivery_address?.street && userProfile.delivery_address?.city && userProfile.delivery_address?.postal_code);

  const handleSendMessage = async (textToSend?: string) => {
    if (!userProfile.isLoggedIn) {
      setActiveTab('settings');
      showAlert({
        title: 'Sign In Required',
        message: 'Please sign in with your Google account in Settings to start shopping with the CatalogX Agent.',
        type: 'warning',
      });
      return;
    }

    if (!hasCompleteDelivery) {
      setActiveTab('settings');
      showAlert({
        title: 'Delivery Details Required',
        message: 'Please configure your shipping address and contact phone in Settings before using the Agent.',
        type: 'warning',
      });
      return;
    }

    const prompt = (textToSend || chatInput).trim();
    if (!prompt || isSpawning) return;

    let targetSession = activeSessionId;
    if (!targetSession) {
      targetSession = `sess_${Math.random().toString(36).substring(2, 9)}`;
      setActiveSessionId(targetSession);
    }

    const previousHumanMsgs = humanMessagesBySession[targetSession] || [];
    const humanMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: 'human',
      role: 'user',
      text: prompt,
      timestamp: new Date().toISOString(),
    };
    const nextHumanMsgs = [...previousHumanMsgs, humanMsg];
    const updatedMap = {
      ...humanMessagesBySession,
      [targetSession]: nextHumanMsgs,
    };
    setHumanMessagesBySession(updatedMap);
    localStorage.setItem('catalogx_human_msgs', JSON.stringify(updatedMap));

    // Title generation: Trigger exactly after 2 messages in this session
    const currentTitle = sessionTitles[targetSession];
    const isNewChat = !currentTitle || currentTitle === 'New Chat' || currentTitle.startsWith('sess_');
    if (nextHumanMsgs.length === 2 && isNewChat) {
      const summaryContext = nextHumanMsgs.map((m) => m.text).join('\n');
      fetch('/api/agent/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: summaryContext }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.title) {
            setSessionTitles((prev) => {
              const updated = { ...prev, [targetSession!]: data.title };
              localStorage.setItem('catalogx_session_titles', JSON.stringify(updated));
              return updated;
            });
            if (userProfile.isLoggedIn && userProfile.email) {
              fetch('/api/sessions/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: targetSession,
                  userEmail: userProfile.email,
                  title: data.title,
                }),
              }).catch(() => {});
            }
          }
        })
        .catch((err) => {
          console.error('[Title Summary Error]:', err);
        });
    }

    // Sync session to MongoDB Atlas
    if (userProfile.isLoggedIn && userProfile.email) {
      fetch('/api/sessions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: targetSession,
          userEmail: userProfile.email,
          title: sessionTitles[targetSession] || 'New Chat',
          messages: updatedMap[targetSession],
        }),
      }).catch(() => {});
    }

    setChatInput('');
    setIsSpawning(true);
    setStreamingStatus('Understanding request & extracting constraints...');

    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: prompt,
          sessionId: targetSession,
          merchantUrl: 'http://localhost:3001',
          userProfile,
        }),
      });

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                if (data.type === 'done' || data.type === 'error') {
                  setIsSpawning(false);
                  setStreamingStatus('');
                  refreshEvents();
                } else if (data.type === 'stdout' && data.text) {
                  const text = data.text;
                  if (text.includes('Phase 1:') || text.includes('INSTRUCTION_PARSED')) {
                    setStreamingStatus('Understanding request & parsing preferences...');
                  } else if (text.includes('Phase 2:') || text.includes('CATALOG_DISCOVERED') || text.includes('Semantic Router')) {
                    setStreamingStatus('Discovering federated merchant catalogs...');
                  } else if (text.includes('Phase 3:') || text.includes('SEARCH_COMPLETED') || text.includes('SEARCH_NO_RESULTS')) {
                    setStreamingStatus('Searching products across federated network...');
                  } else if (text.includes('Phase 4:') || text.includes('PRODUCT_RECOMMENDED')) {
                    setStreamingStatus('Selecting best match & formulating recommendation...');
                  } else if (text.includes('CLARIFICATION_REQUESTED') || text.includes('Option Needed:')) {
                    setIsSpawning(false);
                    setStreamingStatus('');
                  }
                  refreshEvents();
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      console.error('[Agent Trigger Error]:', err);
    } finally {
      setIsSpawning(false);
      setStreamingStatus('');
      refreshEvents();
    }
  };

  // 1-Click Mandate Buy Execution (Headless)
  const handleMandateOneClickBuy = async (targetOrderId?: string) => {
    let orderId = targetOrderId;
    if (!orderId) {
      const ev = [...activeSessionEvents].reverse().find((e) => e.type === 'ORDER_CREATED');
      if (ev) {
        const out = (ev.output_data || {}) as Record<string, any>;
        const inp = (ev.input_data || {}) as Record<string, any>;
        orderId = out.razorpay_order_id || inp.razorpay_order_id || ev.razorpay_order_id;
      }
    }

    if (!orderId) {
      showAlert({
        title: 'Order Not Found',
        message: 'No active Razorpay order found for this purchase.',
        type: 'error',
      });
      return;
    }

    setIsCapturingMandate(true);
    try {
      let res;
      try {
        res = await fetch(`${DEFAULT_URBANSTRIDE_URL}/api/payments/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ razorpay_order_id: orderId, session_id: activeSessionId }),
        });
        if (!res.ok && res.status === 404) throw new Error('Retry TechCart');
      } catch {
        res = await fetch(`${DEFAULT_TECHCART_URL}/api/payments/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ razorpay_order_id: orderId, session_id: activeSessionId }),
        });
      }

      const data = await res.json();
      if (!res.ok && res.status !== 409) {
        throw new Error(data.error || 'Payment capture failed');
      }

      const formattedAmount = data.amount_inr ? `₹${data.amount_inr}` : `₹${(data.amount_paise / 100).toLocaleString('en-IN')}`;
      const paidMsg: ChatMessage = {
        id: `h_paid_${Date.now()}`,
        sender: 'agent',
        text: `Autonomous payment of **${formattedAmount}** captured & verified via Pre-authorized 1-Click Mandate!\n\n- **Transaction ID**: \`${data.razorpay_payment_id}\`\n- **Razorpay Order**: \`${data.razorpay_order_id || orderId}\`\n- **Status**: Paid & Confirmed`,
        timestamp: new Date().toISOString(),
      };

      if (activeSessionId) {
        setHumanMessagesBySession((prev) => ({
          ...prev,
          [activeSessionId]: [...(prev[activeSessionId] || []), paidMsg],
        }));

        if (userProfile.isLoggedIn && userProfile.email) {
          fetch('/api/sessions/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: activeSessionId,
              userEmail: userProfile.email,
              isPaid: true,
              lastOrder: {
                orderId: data.razorpay_order_id || orderId,
                paymentId: data.razorpay_payment_id,
                amount: { inr: data.amount_inr, paise: data.amount_paise, display: formattedAmount },
                status: 'PAID',
              },
            }),
          }).catch(() => {});
        }
      }

      showAlert({
        title: 'Payment Successful',
        message: `Order paid successfully! Transaction ID: ${data.razorpay_payment_id}`,
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'AutoPay Mandate Error',
        message: err.message || 'AutoPay capture failed',
        type: 'error',
      });
    } finally {
      setIsCapturingMandate(false);
      refreshEvents();
    }
  };

  // Standard 2FA OTP Razorpay Checkout
  const handleRazorpay2FACheckout = async (targetOrderId?: string, amountDisplay?: string, merchantUrl: string = DEFAULT_URBANSTRIDE_URL) => {
    let orderId = targetOrderId;
    if (!orderId) {
      const ev = [...activeSessionEvents].reverse().find((e) => e.type === 'ORDER_CREATED');
      if (ev) {
        const out = (ev.output_data || {}) as Record<string, any>;
        const inp = (ev.input_data || {}) as Record<string, any>;
        orderId = out.razorpay_order_id || inp.razorpay_order_id || ev.razorpay_order_id;
      }
    }

    if (!orderId) {
      showAlert({
        title: 'Order Not Found',
        message: 'No active Razorpay order found for this purchase.',
        type: 'error',
      });
      return;
    }

    const processSimulation = async () => {
      try {
        let res;
        try {
          res = await fetch(`${DEFAULT_URBANSTRIDE_URL}/api/payments/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: orderId,
              session_id: activeSessionId,
              status: 'PAID',
              action: '2fa_authorized',
            }),
          });
          if (!res.ok && res.status === 404) throw new Error('Retry TechCart');
        } catch {
          res = await fetch(`${DEFAULT_TECHCART_URL}/api/payments/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: orderId,
              session_id: activeSessionId,
              status: 'PAID',
              action: '2fa_authorized',
            }),
          });
        }

        const data = await res.json();
        const formattedAmount = data.amount_inr ? `₹${data.amount_inr}` : amountDisplay || 'Authorized Amount';
        const paidMsg: ChatMessage = {
          id: `h_paid_2fa_${Date.now()}`,
          sender: 'agent',
          text: `Payment of **${formattedAmount}** verified via **Razorpay 2FA OTP Authentication**!\n\n- **Payment ID**: \`${data.razorpay_payment_id}\`\n- **Order ID**: \`${data.razorpay_order_id || orderId}\`\n- **Status**: Paid & Confirmed`,
          timestamp: new Date().toISOString(),
        };

        if (activeSessionId) {
          setHumanMessagesBySession((prev) => ({
            ...prev,
            [activeSessionId]: [...(prev[activeSessionId] || []), paidMsg],
          }));

          if (userProfile.isLoggedIn && userProfile.email) {
            fetch('/api/sessions/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: activeSessionId,
                userEmail: userProfile.email,
                isPaid: true,
                lastOrder: {
                  orderId: data.razorpay_order_id || orderId,
                  paymentId: data.razorpay_payment_id,
                  amount: { inr: data.amount_inr, paise: data.amount_paise, display: formattedAmount },
                  status: 'PAID',
                },
              }),
            }).catch(() => {});
          }
        }

        refreshEvents();
        showAlert({
          title: '2FA Payment Confirmed',
          message: `Razorpay 2FA payment approved! Transaction ID: ${data.razorpay_payment_id}`,
          type: 'success',
        });
      } catch (err: any) {
        showAlert({
          title: 'Payment Error',
          message: err.message || 'Payment authorization failed.',
          type: 'error',
        });
      }
    };

    // If Razorpay SDK is loaded on window, open the standard Razorpay checkout modal
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      try {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TSjdfOWmYoGtxa',
          order_id: orderId,
          name: 'CatalogX Agent Checkout',
          description: 'High-Value 2FA Purchase Authorization',
          image: '/catalogx.png',
          prefill: {
            name: userProfile.name || 'Shreyash',
            email: userProfile.email || 'shreyash3087@gmail.com',
            contact: userProfile.phone || '8707336921',
          },
          theme: { color: '#0c6cf2' },
          handler: async (response: any) => {
            await processSimulation();
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      } catch (e) {}
    }

    // Direct 2FA authorization flow fallback
    showAlert({
      title: 'Razorpay 2FA High-Value Authorization',
      message: `Authorize 2FA OTP payment of ${amountDisplay || 'this order'} (${orderId}) via Razorpay test gateway?`,
      type: 'confirm',
      confirmText: 'Authorize Payment',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await processSimulation();
      },
    });
  };

  const isLight = theme === 'light';
  const isMandateActive = !!(userProfile.isLoggedIn && activeMandate && activeMandate.status === 'ACTIVE');

  return (
    <div className={`flex h-screen overflow-hidden select-none ${isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0B0D0E] text-[#F5F1E8]'}`}>
      {/* 1. Left Deep Navy Enterprise Sidebar */}
      <Sidebar
        sessions={sessionList}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={userProfile}
        onUserChange={(updated) => setUserProfile(updated)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar (Razorpay style) */}
        <header
          className={`flex items-center justify-between px-6 py-3 border-b flex-shrink-0 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#10141a] border-[#1d2738]'
          }`}
        >
          {/* Breadcrumb navigation */}
          <div className="flex items-center gap-2 text-xs">
            <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>Catalog</span>
            <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>/</span>
            <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              {activeTab === 'chat'
                ? 'Chat & Checkout'
                : activeTab === 'orders'
                ? 'Orders Ledger'
                : 'System & Mandate Settings'}
            </span>
          </div>

          {/* Right Action Badges */}
          <div className="flex items-center gap-3">
            {/* On-Demand Activity Canvas Button */}
            <button
              onClick={() => setIsActivityCanvasOpen(!isActivityCanvasOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-normal border transition-all flex items-center gap-1.5 cursor-pointer ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                  : 'bg-[#162030] hover:bg-[#1f2d44] text-slate-200 border-[#2a3c5a]'
              }`}
            >
              <i className="fa-regular fa-rectangle-list text-blue-500 text-[11px]" />
              <span>Activity Log</span>
              {activeSessionEvents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-600 text-white">
                  {activeSessionEvents.length}
                </span>
              )}
            </button>

            {/* AutoPay Mandate Status Tag (Static Tag without popup) */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border select-none ${
                isMandateActive
                  ? isLight
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs'
                    : 'bg-emerald-950/50 text-emerald-300 border-emerald-700/60'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isMandateActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isMandateActive ? 'AutoPay: Active' : 'AutoPay: Inactive'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        {activeTab === 'settings' ? (
          <div className="flex-1 flex min-h-0 w-full overflow-hidden">
            <SettingsTab
              mandate={activeMandate}
              onOpenVault={() => setIsVaultOpen(true)}
              user={userProfile}
              onUserChange={setUserProfile}
              theme={theme}
              showAlert={showAlert}
            />
            <ActivityCanvas
              isOpen={isActivityCanvasOpen}
              onClose={() => setIsActivityCanvasOpen(false)}
              events={activeSessionEvents}
              selectedId={selectedEvent?.id || null}
              onSelect={setSelectedEvent}
              selectedEvent={selectedEvent}
              theme={theme}
            />
          </div>
        ) : activeTab === 'orders' ? (
          <div className="flex-1 flex min-h-0 w-full overflow-hidden">
            <OrdersTab events={activeSessionEvents} theme={theme} />
            <ActivityCanvas
              isOpen={isActivityCanvasOpen}
              onClose={() => setIsActivityCanvasOpen(false)}
              events={activeSessionEvents}
              selectedId={selectedEvent?.id || null}
              onSelect={setSelectedEvent}
              selectedEvent={selectedEvent}
              theme={theme}
            />
          </div>
        ) : (
          /* Clean Minimalist Chat Canvas (Part of main screen with max-w) */
          <div className="flex-1 flex min-h-0 w-full overflow-hidden">
            {/* Main Chat Canvas with Max Width */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0 max-w-3xl w-full mx-auto p-4 md:p-6 overflow-hidden">
                {/* Scrollable Message Stream - No Visible Scrollbar */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 no-scrollbar">
                  {currentMessages.length === 0 ? (
                    /* Welcoming Hero State when Empty */
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4 animate-fade-in my-auto">
                      <img
                        src="/catalogx.png"
                        alt="CatalogX"
                        className="w-18 h-18 rounded-full object-cover shadow-lg border-2 border-blue-500/30"
                      />

                      <div className="space-y-1 max-w-md">
                        <h2
                          className={`text-lg font-medium tracking-tight ${
                            isLight ? 'text-slate-800' : 'text-slate-100'
                          }`}
                        >
                          Hi {userProfile.name}, Ready to purchase across merchants?
                        </h2>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} leading-relaxed font-normal`}>
                          Your CatalogX buyer agent autonomously discovers products, enforces spend governor guardrails, and executes 1-click purchases under your pre-authorized mandate.
                        </p>
                      </div>

                      {/* Quick Starter Pills */}
                      <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
                        {[
                          'Buy running shoes under 1500',
                          'Buy flagship shoes under 30000',
                          'Find wireless earbuds under 2000',
                          'Mechanical keyboard with brown switches',
                        ].map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => handleSendMessage(prompt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-normal border transition-all cursor-pointer active:scale-95 ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                                : 'bg-[#131a24] hover:bg-[#1a2536] text-slate-300 border-[#22314a]'
                            }`}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Message Stream */
                    currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === 'human' ? 'items-end' : 'items-start'
                        } animate-fade-in`}
                      >
                        {msg.sender === 'human' ? (
                          /* Human Message (Pill Style on Right) */
                          <div className="max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2 text-xs shadow-xs font-normal">
                            <div>{msg.text}</div>
                            <div className="text-[9px] text-blue-200 text-right mt-1 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          /* Agent Message (Image 3 Style: Unboxed Text with Character Avatar!) */
                          <div className="w-full flex items-start gap-3 text-xs animate-fade-in my-1.5">
                            {/* Character Avatar */}
                            <img
                              src="/catalogx.png"
                              alt="CatalogX"
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs"
                            />

                            <div className="flex-1 min-w-0 space-y-2.5">
                              {/* Unboxed Agent Response Text */}
                              <div className={`leading-relaxed font-normal text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                {msg.text.includes('Cryptographic Payment Verified') ? (
                                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                    <span>{msg.text}</span>
                                  </span>
                                ) : (
                                  <FormattedMarkdown content={msg.text} isLight={isLight} />
                                )}
                              </div>

                              {/* Rich Product Card (Clean Layout) */}
                              {msg.product && (
                                <div
                                  className={`p-3.5 rounded-xl border flex items-center gap-3.5 max-w-lg ${
                                    isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#141b27] border-[#22314a]'
                                  }`}
                                >
                                  {msg.product.imageUrl ? (
                                    <img
                                      src={
                                        msg.product.imageUrl.startsWith('http')
                                          ? msg.product.imageUrl
                                          : `http://localhost:3001${msg.product.imageUrl}`
                                      }
                                      alt={msg.product.name}
                                      className="w-14 h-14 rounded-lg object-cover bg-black/10 border border-slate-200 flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-base flex-shrink-0">
                                      <i className="fa-regular fa-folder-open" />
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-1">
                                      <span className={`text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                        {msg.product.name}
                                      </span>
                                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                        {msg.product.priceDisplay}
                                      </span>
                                    </div>
                                    {msg.product.brand && (
                                      <div className="text-[11px] text-slate-500 font-normal">
                                        Brand: {msg.product.brand}
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between pt-1 text-[11px]">
                                      <a
                                        href={formatStorefrontUrl(msg.product.productUrl, msg.product.id, msg.product.merchantUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>View on Storefront</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                                      </a>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-normal flex items-center gap-1">
                                        <i className="fa-regular fa-circle-check text-[10px]" /> In Stock
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Interactive Upsell Box */}
                              {msg.upsell && (
                                <div
                                  className={`p-4 rounded-xl border space-y-2.5 max-w-lg ${
                                    isLight
                                      ? 'bg-[#F1F5F9] border-slate-300 text-slate-900 shadow-xs'
                                      : 'bg-[#161d28] border-[#22314a] text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <span
                                      className={`font-bold flex items-center gap-1.5 ${
                                        isLight ? 'text-slate-950' : 'text-white'
                                      }`}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                                      <span>Frequently Bought Together</span>
                                    </span>
                                    <span
                                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold border shadow-xs ${
                                        isLight
                                          ? 'bg-amber-200 text-amber-950 border-amber-400'
                                          : 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                                      }`}
                                    >
                                      {msg.upsell.discount || 'Bundle Deal'}
                                    </span>
                                  </div>
                                  <p
                                    className={`text-xs leading-relaxed font-normal ${
                                      isLight ? 'text-slate-950' : 'text-slate-200'
                                    }`}
                                  >
                                    Pair this with{' '}
                                    <strong className={isLight ? 'text-black font-bold' : 'text-white font-bold'}>
                                      {msg.upsell.name}
                                    </strong>{' '}
                                    for{' '}
                                    <span className={isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold'}>
                                      {msg.upsell.bundlePrice}
                                    </span>.
                                  </p>
                                  <button
                                    onClick={() => {
                                      setAcceptedUpsells((prev) => ({
                                        ...prev,
                                        [msg.id]: !prev[msg.id],
                                      }));
                                    }}
                                    className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                      acceptedUpsells[msg.id]
                                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                                        : isLight
                                        ? 'bg-white border border-slate-950 text-slate-950 hover:bg-slate-100 shadow-xs'
                                        : 'bg-[#11161f] border border-slate-700 text-slate-200 hover:bg-white/10'
                                    }`}
                                  >
                                    {acceptedUpsells[msg.id] ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    )}
                                    <span>{acceptedUpsells[msg.id] ? 'Added to Order (Click to Remove)' : `+ Add to Order (${msg.upsell.bundlePrice})`}</span>
                                  </button>
                                </div>
                              )}

                               {/* Interactive Recommendation Confirmation Actions */}
                               {msg.isRecommended && !msg.orderId && (
                                 <div className="pt-2 flex flex-wrap items-center gap-2 max-w-lg">
                                   <button
                                     onClick={() => {
                                       if (acceptedUpsells[msg.id] && msg.upsell) {
                                         handleSendMessage(`Add ${msg.upsell.name} and place order`);
                                       } else {
                                         handleSendMessage('Place the order');
                                       }
                                     }}
                                     className={`py-2 px-3.5 font-medium text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                       isLight
                                         ? 'bg-[#0c6cf2] hover:bg-blue-700 text-white'
                                         : 'bg-blue-600 hover:bg-blue-500 text-white'
                                     }`}
                                   >
                                     <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                     <span>
                                       {acceptedUpsells[msg.id] && msg.upsell
                                         ? `Place Order + Bundle (${msg.product?.priceDisplay || ''} ${msg.upsell.bundlePrice})`
                                         : `Place Order ${msg.product?.priceDisplay ? `(${msg.product.priceDisplay})` : ''}`}
                                     </span>
                                   </button>
                                   <button
                                     onClick={() => handleSendMessage('Show other options')}
                                     className={`py-2 px-3 text-xs font-normal rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                                       isLight
                                         ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                         : 'bg-[#141b27] hover:bg-white/10 text-slate-300 border-[#22314a]'
                                     }`}
                                   >
                                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                                     <span>Show Other Options</span>
                                   </button>
                                 </div>
                               )}

                              {/* Action Buy Buttons (Adaptive Light & Dark Mode) */}
                              {msg.orderId && !msg.text.includes('PAID') && (
                                <div className="pt-1 max-w-sm">
                                  {msg.isTier1 && isMandateActive ? (
                                    <button
                                      onClick={() => handleMandateOneClickBuy(msg.orderId)}
                                      disabled={isCapturingMandate}
                                      className={`w-full py-2.5 px-4 font-medium text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 ${
                                        isLight
                                          ? 'bg-[#0c6cf2] hover:bg-blue-700 text-white shadow-sm'
                                          : 'bg-[#090D16] text-white border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:border-blue-400'
                                      }`}
                                    >
                                      <i className={`fa-regular fa-credit-card text-xs ${isLight ? 'text-white' : 'text-blue-400'}`} />
                                      <span>
                                        {isCapturingMandate
                                          ? 'Authorizing AutoPay...'
                                          : `1-Click Buy via Mandate ${msg.amountDisplay ? `(${msg.amountDisplay})` : ''}`}
                                      </span>
                                    </button>
                                  ) : msg.isTier1 ? (
                                    <button
                                      onClick={() => setIsVaultOpen(true)}
                                      className={`w-full py-2 px-3 font-medium text-xs rounded-xl transition-all cursor-pointer ${
                                        isLight
                                          ? 'bg-[#0c6cf2] hover:bg-blue-700 text-white shadow-xs'
                                          : 'bg-[#090D16] text-white border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:border-blue-400'
                                      }`}
                                    >
                                      Setup Mandate (₹1 Auth)
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleRazorpay2FACheckout(msg.orderId, msg.amountDisplay, msg.product?.merchantUrl)}
                                      className={`w-full py-2.5 px-4 font-medium text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                                        isLight
                                          ? 'bg-[#0c6cf2] hover:bg-blue-700 text-white shadow-sm'
                                          : 'bg-[#090D16] text-white border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:border-blue-400'
                                      }`}
                                    >
                                      <i className={`fa-regular fa-shield text-xs ${isLight ? 'text-white' : 'text-blue-400'}`} />
                                      <span>Pay with Razorpay 2FA {msg.amountDisplay ? `(${msg.amountDisplay})` : ''}</span>
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Subtle Audit Trail link */}
                              <div className="pt-0.5">
                                <button
                                  onClick={() => setIsActivityCanvasOpen(true)}
                                  className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 cursor-pointer font-normal"
                                >
                                  <i className="fa-regular fa-rectangle-list text-[10px]" />
                                  <span>Audit Trail</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {/* Agent Streaming & Thinking Indicator */}
                  {isSpawning && (
                    <div className="w-full flex items-start gap-3 text-xs animate-fade-in my-2">
                      {/* Character Avatar with Glowing Ping Ring */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <img
                          src="/catalogx.png"
                          alt="CatalogX"
                          className="w-7 h-7 rounded-full object-cover border border-blue-500/50 shadow-xs"
                        />
                        <div className="absolute -inset-0.5 rounded-full border border-blue-500/40 animate-ping pointer-events-none" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                        <div className="flex items-center gap-2">
                          {/* Animated Circular Spinner */}
                          <svg className="animate-spin h-3.5 w-3.5 text-blue-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                            {streamingStatus || 'Agent is reasoning & searching federated catalogs...'}
                          </span>
                        </div>

                        {/* Subtle Pulsating Thought Dots */}
                        <div className="flex items-center gap-1.5 pl-5.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                          <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'} ml-1 font-mono`}>
                            Federated reasoning in progress
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input or Requirements Gate */}
                {!userProfile.isLoggedIn ? (
                  <div
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs flex-shrink-0 ${
                      isLight ? 'bg-blue-50/70 border-blue-200 text-slate-900' : 'bg-[#111827] border-blue-900/50 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold">Authentication Required to Chat</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Please sign in with Google in Settings to start shopping with the CatalogX Agent.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                    >
                      <span>Sign In in Settings</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                ) : !hasCompleteDelivery ? (
                  <div
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs flex-shrink-0 ${
                      isLight ? 'bg-amber-50/80 border-amber-200 text-slate-900' : 'bg-[#1e1710] border-amber-900/50 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold">Delivery Location & Contact Required</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Configure your shipping address and phone number in Settings before placing orders.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                    >
                      <span>Configure Address</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className={`p-1.5 rounded-2xl border shadow-xs flex items-center gap-2 flex-shrink-0 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#121721] border-[#22314a]'
                    }`}
                  >
                    <input
                      type="text"
                      placeholder="Ask Agent to buy running shoes, earbuds, mechanical keyboards..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isSpawning}
                      className={`flex-1 px-4 py-2 text-xs bg-transparent focus:outline-none ${
                        isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-slate-200 placeholder:text-slate-500'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isSpawning || !chatInput.trim()}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                        isSpawning
                          ? 'bg-blue-600/60 text-white cursor-wait'
                          : chatInput.trim()
                          ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                          : 'bg-black/5 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                      }`}
                      title={isSpawning ? 'Agent Working...' : 'Send Message'}
                    >
                      {isSpawning ? (
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                        </svg>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Docked Activity Canvas as part of main screen with smooth slide animation */}
            <ActivityCanvas
              isOpen={isActivityCanvasOpen}
              onClose={() => setIsActivityCanvasOpen(false)}
              events={activeSessionEvents}
              selectedId={selectedEvent?.id || null}
              onSelect={setSelectedEvent}
              selectedEvent={selectedEvent}
              theme={theme}
            />
          </div>
        )}
      </main>

      {/* 4. Pre-Authorized Mandate Vault Modal */}
      <MandateVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        mandate={activeMandate}
        onMandateUpdated={setActiveMandate}
        theme={theme}
        showAlert={showAlert}
      />

      {/* 5. Custom Themed Notification & Confirmation Modal */}
      <NotificationModal
        isOpen={!!notification}
        options={notification}
        onClose={() => setNotification(null)}
        theme={theme}
      />
    </div>
  );
}
