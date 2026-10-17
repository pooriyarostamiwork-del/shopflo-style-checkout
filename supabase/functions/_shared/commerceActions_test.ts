import { normalizeQty, resolveCartTurn, resolveCheckoutTurn } from "./commerceActions.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

for (const [mode, field, value] of [
  ["increase", "delta", 1], ["decrease", "delta", -1], ["set", "quantity", 1],
] as const) {
  Deno.test(`LLM ${mode} is preserved without another model judgment`, () => {
    const result = normalizeQty({ type: "update_quantity", product_id: "item", qty_mode: mode, amount: 1 });
    equal(result[field], value);
    equal(result[field === "delta" ? "quantity" : "delta"], undefined);
  });
}

Deno.test("LLM removal remains removal", () => {
  equal(normalizeQty({ type: "update_quantity", product_id: "item", qty_mode: "remove", amount: 1 }).type, "remove");
});

Deno.test("compound cart directions remain independent", () => {
  const result = resolveCartTurn({
    userText: "", cart: [{ id: "a", name: "A", quantity: 3 }, { id: "b", name: "B", quantity: 4 }], offers: [],
    modelActions: [
      { type: "update_quantity", product_id: "a", qty_mode: "increase", amount: 1 },
      { type: "update_quantity", product_id: "b", qty_mode: "set", amount: 1 },
    ],
  });
  equal(result.actions, [{ type: "update_quantity", product_id: "a", quantity: 4 }, { type: "update_quantity", product_id: "b", quantity: 1 }]);
});

Deno.test("LLM cart confirmation advances only the matching nonempty step", () => {
  const base = { kind: "confirm_cart", userText: "", surface: "web" as const, cartCount: 1 };
  equal(resolveCheckoutTurn({ ...base, ctx: { step: "cart-confirmation" } }).advance, "confirm_cart");
  equal(resolveCheckoutTurn({ ...base, ctx: { step: "payment-selection" } }).advance, undefined);
  equal(resolveCheckoutTurn({ ...base, cartCount: 0, ctx: { step: "cart-confirmation" } }).advance, undefined);
});

Deno.test("LLM address confirmation needs a current saved address and shipping", () => {
  const base = { kind: "confirm_address", userText: "", surface: "web" as const, cartCount: 1 };
  const ctx = { step: "address-confirmation", logged_in: true, addresses: [{ id: "a", title: "A" }], selected_address_id: "a", shipping_id: "standard" };
  equal(resolveCheckoutTurn({ ...base, ctx }).advance, "confirm_address");
  equal(resolveCheckoutTurn({ ...base, ctx: { ...ctx, selected_address_id: "unknown" } }).advance, undefined);
  equal(resolveCheckoutTurn({ ...base, ctx: { ...ctx, shipping_id: null } }).advance, undefined);
  equal(resolveCheckoutTurn({ ...base, ctx: { ...ctx, logged_in: false } }).advance, undefined);
});

Deno.test("LLM payment selection respects live availability", () => {
  const base = { kind: "select_payment", payment_id: "wallet", userText: "", surface: "web" as const, cartCount: 1 };
  equal(resolveCheckoutTurn({ ...base, ctx: { payments: [{ id: "wallet", label: "wallet", available: false }] } }).directive, undefined);
  equal(resolveCheckoutTurn({ ...base, ctx: { payments: [{ id: "wallet", label: "wallet", available: true }] } }).directive, { kind: "select_payment", id: "wallet" });
});