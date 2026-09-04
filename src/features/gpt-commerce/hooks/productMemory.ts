import { Product } from "@/data/gptCommerceData";

// ============================================================================
// Conversation product memory
// ----------------------------------------------------------------------------
// A per-basket working memory of every product group the assistant has shown,
// what the user liked / rejected / added, and what "this" / "these" currently
// point at. Fully category-agnostic: nothing here knows about laptops, pets or
// any other vertical — it only tracks groups, positions, ids and free-text
// facts, so it works for every catalogue inside Flowcart.
// ============================================================================

export interface MemoryEntry {
  product: Product;
  groupId: string;
  position: number;      // 1-based position inside its group (the chat badge)
  facts: string[];       // specs/price/pros already stated in conversation
}

export interface MemoryGroup {
  groupId: string;
  turn: number;          // user-turn index the group was shown at
  query: string;         // the request that produced the group
  productIds: string[];
  shownAt: string;
}

export interface ProductMemory {
  groups: MemoryGroup[];                     // oldest → newest
  entries: Record<string, MemoryEntry>;
  liked: string[];
  rejected: string[];
  inCart: string[];
  focus: { productIds: string[]; groupId: string | null };
}

const MAX_GROUPS = 6;
const MAX_ENTRIES = 40;

export const createEmptyProductMemory = (): ProductMemory => ({
  groups: [],
  entries: {},
  liked: [],
  rejected: [],
  inCart: [],
  focus: { productIds: [], groupId: null },
});

export const ensureProductMemory = (mem?: ProductMemory | null): ProductMemory =>
  mem && Array.isArray(mem.groups) ? mem : createEmptyProductMemory();

// ── Drop the oldest groups (and their orphaned entries) to keep payloads small ──
const prune = (mem: ProductMemory): ProductMemory => {
  let groups = mem.groups.slice(-MAX_GROUPS);

  // also cap by total entries, dropping whole groups from the front
  while (groups.reduce((n, g) => n + g.productIds.length, 0) > MAX_ENTRIES && groups.length > 1) {
    groups = groups.slice(1);
  }

  const keep = new Set(groups.flatMap(g => g.productIds));
  const entries: Record<string, MemoryEntry> = {};
  for (const id of Object.keys(mem.entries)) {
    // keep anything still in a live group, plus anything the user committed to
    if (keep.has(id) || mem.liked.includes(id) || mem.inCart.includes(id)) {
      entries[id] = mem.entries[id];
    }
  }
  return { ...mem, groups, entries };
};

// ── Append a brand-new group of shown products (never overwrites earlier ones) ──
export const appendGroup = (
  mem: ProductMemory,
  query: string,
  products: Product[],
  turn: number,
): ProductMemory => {
  if (products.length === 0) return mem;
  const groupId = `G${mem.groups.length + 1}-${Date.now().toString(36)}`;
  const entries = { ...mem.entries };
  products.forEach((product, i) => {
    entries[product.id] = {
      product,
      groupId,
      position: i + 1,
      facts: entries[product.id]?.facts ?? [],
    };
  });

  const group: MemoryGroup = {
    groupId,
    turn,
    query: query.slice(0, 120),
    productIds: products.map(p => p.id),
    shownAt: new Date().toISOString(),
  };

  return prune({
    ...mem,
    groups: [...mem.groups, group],
    entries,
    focus: { productIds: group.productIds, groupId },
  });
};

// ── A single product became the subject of the conversation (PDP / details) ──
export const focusProduct = (mem: ProductMemory, product: Product, facts: string[] = []): ProductMemory => {
  const existing = mem.entries[product.id];
  const entries = {
    ...mem.entries,
    [product.id]: {
      product,
      groupId: existing?.groupId ?? 'ad-hoc',
      position: existing?.position ?? 1,
      facts: Array.from(new Set([...(existing?.facts ?? []), ...facts])).slice(0, 12),
    },
  };
  return { ...mem, entries, focus: { productIds: [product.id], groupId: existing?.groupId ?? null } };
};

export const recordFacts = (mem: ProductMemory, productId: string, facts: string[]): ProductMemory => {
  const existing = mem.entries[productId];
  if (!existing || facts.length === 0) return mem;
  return {
    ...mem,
    entries: {
      ...mem.entries,
      [productId]: { ...existing, facts: Array.from(new Set([...existing.facts, ...facts])).slice(0, 12) },
    },
  };
};

type Commitment = 'liked' | 'rejected' | 'inCart';

// ── Commitment levels are distinct: shown ≠ liked ≠ wanted ≠ in cart ──
export const markCommitment = (mem: ProductMemory, ids: string[], level: Commitment): ProductMemory => {
  if (ids.length === 0) return mem;
  const next: ProductMemory = { ...mem };
  const add = (list: string[]) => Array.from(new Set([...list, ...ids])).slice(-30);
  const remove = (list: string[]) => list.filter(id => !ids.includes(id));

  if (level === 'liked') {
    next.liked = add(mem.liked);
    next.rejected = remove(mem.rejected);
  } else if (level === 'rejected') {
    // A rejection is a soft signal: the product stays recallable, it is only
    // de-prioritised for new recommendations.
    next.rejected = add(mem.rejected);
    next.liked = remove(mem.liked);
  } else {
    next.inCart = add(mem.inCart);
    next.rejected = remove(mem.rejected);
  }
  return next;
};

export const unmarkInCart = (mem: ProductMemory, ids: string[]): ProductMemory => ({
  ...mem,
  inCart: mem.inCart.filter(id => !ids.includes(id)),
});

export const setFocus = (mem: ProductMemory, productIds: string[], groupId: string | null = null): ProductMemory => ({
  ...mem,
  focus: { productIds, groupId },
});

// ── Resolution helpers used by the client after the model answers ──
export const latestGroup = (mem: ProductMemory): MemoryGroup | undefined => mem.groups[mem.groups.length - 1];

export const resolveByPosition = (mem: ProductMemory, position: number, groupId?: string | null): Product | undefined => {
  const group = groupId ? mem.groups.find(g => g.groupId === groupId) : latestGroup(mem);
  const id = group?.productIds[position - 1];
  return id ? mem.entries[id]?.product : undefined;
};

export const resolveById = (mem: ProductMemory, id: string): Product | undefined => mem.entries[id]?.product;

export const resolveByName = (mem: ProductMemory, name: string): Product[] => {
  const needle = name.trim().toLowerCase();
  if (!needle) return [];
  return Object.values(mem.entries)
    .filter(e => e.product.name.toLowerCase().includes(needle))
    .map(e => e.product);
};

const fmtPrice = (n: number) => `${Math.round(n / 1_000_000)}M`;

// ── Compact, token-cheap serialisation handed to the agent each turn ──
export const serializeMemory = (mem: ProductMemory): string => {
  if (mem.groups.length === 0) return '';
  const lines: string[] = [];

  mem.groups.forEach((g, gi) => {
    const isLatest = gi === mem.groups.length - 1;
    const items = g.productIds
      .map(id => mem.entries[id])
      .filter(Boolean)
      .map(e => {
        const facts = e.facts.length ? ` (${e.facts.slice(0, 3).join('; ')})` : '';
        return `#${e.position} ${e.product.name} — ${fmtPrice(e.product.price)}${facts}`;
      });
    if (items.length === 0) return;
    lines.push(
      `${g.groupId}${isLatest ? ' [LATEST]' : ''} | turn ${g.turn} | user asked: "${g.query}"\n  ${items.join('\n  ')}`,
    );
  });

  const nameOf = (id: string) => mem.entries[id]?.product.name;
  const liked = mem.liked.map(nameOf).filter(Boolean);
  const rejected = mem.rejected.map(nameOf).filter(Boolean);
  const inCart = mem.inCart.map(nameOf).filter(Boolean);
  const focus = mem.focus.productIds.map(nameOf).filter(Boolean);

  if (liked.length) lines.push(`LIKED: ${liked.join(', ')}`);
  if (rejected.length) lines.push(`REJECTED (do not re-recommend as the main answer): ${rejected.join(', ')}`);
  if (inCart.length) lines.push(`IN CART: ${inCart.join(', ')}`);
  if (focus.length) lines.push(`CURRENT FOCUS ("this"/"these" most likely means): ${focus.join(', ')}`);

  return lines.join('\n');
};
