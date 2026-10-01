interface ConversationProduct {
  id: string;
  name: string;
}

interface ConversationMessage<P> {
  id: string;
  role: "assistant";
  content: string;
  inlineProduct: P;
  timestamp: Date;
}

interface ProductMemoryEntry<P> {
  product: P;
  groupId: string;
  position: number;
  facts: string[];
}

interface ProductMemoryLike<P> {
  entries: Record<string, ProductMemoryEntry<P>>;
  focus: { productIds: string[]; groupId: string | null };
}

interface ProductConversationState<P> {
  messages: Array<ConversationMessage<P> | unknown>;
  lastRecommendedProducts: P[];
  productMemory: ProductMemoryLike<P>;
  hasStartedChat: boolean;
}

export const createProductEntryMessage = <P extends ConversationProduct>(
  product: P,
  assistantName: string,
): ConversationMessage<P> => ({
  id: `product-entry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role: "assistant",
  content: `سلام! من دستیار خرید هوشمند ${assistantName} هستم. این هم جزئیات و مشخصات «${product.name}». اگر درباره مشخصات، تفاوت با مدل‌های دیگر یا ارسالش سوالی داری، همین‌جا بپرس.`,
  inlineProduct: product,
  timestamp: new Date(),
});

export const seedProductConversation = <
  P extends ConversationProduct,
  S extends ProductConversationState<P>,
>(baseState: S, product: P, assistantName: string): S => {
  const existing = baseState.productMemory.entries[product.id];
  const groupId = existing?.groupId ?? "ad-hoc";

  return {
    ...baseState,
    hasStartedChat: true,
    messages: [createProductEntryMessage(product, assistantName)],
    lastRecommendedProducts: [product],
    productMemory: {
      ...baseState.productMemory,
      entries: {
        ...baseState.productMemory.entries,
        [product.id]: {
          product,
          groupId,
          position: existing?.position ?? 1,
          facts: existing?.facts ?? [],
        },
      },
      focus: { productIds: [product.id], groupId: existing?.groupId ?? null },
    },
  };
};