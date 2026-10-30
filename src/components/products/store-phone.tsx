"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Home, Minus, Plus, Search, ShoppingBag, User } from "lucide-react";
import { Body, Button, Chips, Choice, Done, Header, Label, Stepper, TabBar } from "./phone-kit";
import { ProductArt } from "./store-art";

const peso = (n: number) => `₱${n.toLocaleString("en-US")}`;

// Shopper's view of the Kapwa Coffee Co. online store.

type Size = "250g" | "500g";
const PRICE: Record<Size, number> = { "250g": 560, "500g": 1040 };
const COMPARE: Record<Size, number> = { "250g": 620, "500g": 1150 };
const GRINDS = ["Whole bean", "Drip", "Espresso"];
const FREE_OVER = 1500;
const ADDRESSES = ["Home · Teachers Village, QC", "Office · Ortigas Center, Pasig"];
const PAY = ["GCash", "Maya", "Card •• 4821"];

interface CartLine {
  key: string;
  size: Size;
  grind: string;
  qty: number;
}

export function StorePhone() {
  const [view, setView] = useState<"product" | "cart" | "checkout" | "done">("product");
  const [size, setSize] = useState<Size>("250g");
  const [grind, setGrind] = useState("Whole bean");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [address, setAddress] = useState(ADDRESSES[0]);
  const [delivery, setDelivery] = useState("Standard");
  const [pay, setPay] = useState("GCash");
  const [orderNo, setOrderNo] = useState(1053);
  const [placed, setPlaced] = useState({ total: 0, pay: "GCash", delivery: "Standard" });

  const items = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + l.qty * PRICE[l.size], 0);
  const shipping = delivery === "Same day" ? 220 : subtotal >= FREE_OVER ? 0 : 120;
  const total = subtotal + shipping;

  const addToCart = () => {
    const key = `${size}-${grind}`;
    setCart((list) => (list.some((l) => l.key === key) ? list.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l)) : [...list, { key, size, grind, qty }]));
    setQty(1);
    setView("cart");
  };
  const changeQty = (key: string, delta: number) => setCart((list) => list.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0));
  const placeOrder = () => {
    setPlaced({ total, pay, delivery });
    setView("done");
  };
  const keepShopping = () => {
    setCart([]);
    setOrderNo((n) => n + 1);
    setView("product");
  };

  return (
    <>
      {view === "product" && (
        <>
          <div className="px-4 pt-1 pb-2 flex items-center justify-between shrink-0">
            <span className="text-[0.8rem] font-bold text-ink">Kapwa Coffee Co.</span>
            <button type="button" onClick={() => setView("cart")} className="relative w-8 h-8 rounded-full bg-raised text-ink flex items-center justify-center cursor-pointer" aria-label={`Cart, ${items} items`}>
              <ShoppingBag size={15} />
              {items > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-gold text-sheet text-[0.58rem] font-bold flex items-center justify-center">{items}</span>}
            </button>
          </div>
          <Body>
            <div className="h-36 rounded-2xl overflow-hidden">
              <ProductArt kind="bag" tone={2} className="w-full h-full" />
            </div>
            <div className="mt-1.5 flex justify-center gap-1" aria-hidden>
              <span className="w-4 h-1 rounded-full bg-gold" />
              <span className="w-1.5 h-1 rounded-full bg-rule" />
              <span className="w-1.5 h-1 rounded-full bg-rule" />
            </div>
            <div className="mt-2 text-[1.02rem] font-bold text-ink leading-tight">Sagada Heirloom Arabica</div>
            <div className="mt-0.5 text-[0.66rem] text-mist">Single origin · Medium roast · Roasted Oct 27</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-[1.1rem] font-bold text-ink tabular-nums">{peso(PRICE[size])}</span>
              <span className="text-[0.72rem] text-mist line-through tabular-nums">{peso(COMPARE[size])}</span>
              <span className="text-[0.62rem] font-semibold text-good">Save {peso(COMPARE[size] - PRICE[size])}</span>
            </div>
            <div className="mt-1.5 text-[0.68rem] leading-relaxed text-graphite">Red apple, honey, cocoa. Grown by the Sagada farmers&apos; cooperative.</div>
            <Label>Size</Label>
            <Chips options={["250g", "500g"] as Size[]} value={size} onChange={setSize} />
            <Label>Grind</Label>
            <Chips options={GRINDS} value={grind} onChange={setGrind} />
            <Label>Quantity</Label>
            <Stepper value={qty} onChange={setQty} min={1} max={10} />
            <Button onClick={addToCart}>Add to cart · {peso(PRICE[size] * qty)}</Button>
            <div className="mt-2 text-center text-[0.6rem] text-mist">Free shipping in Metro Manila over {peso(FREE_OVER)}</div>
          </Body>
        </>
      )}

      {view === "cart" && (
        <>
          <Header title="Cart" sub={items ? `${items} ${items === 1 ? "item" : "items"}` : "Your cart is empty"} onBack={() => setView("product")} />
          <Body>
            {cart.length === 0 ? (
              <div className="pt-6 text-center">
                <div className="text-[0.74rem] text-graphite">Nothing here yet.</div>
                <button type="button" onClick={() => setView("product")} className="mt-3 text-[0.74rem] font-semibold text-gold cursor-pointer">
                  Keep shopping
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-rule bg-sheet divide-y divide-rule">
                  {cart.map((l) => (
                    <div key={l.key} className="flex items-center gap-2.5 p-2.5">
                      <span className="w-10 h-10 rounded-lg bg-gold-wash text-gold text-[0.6rem] font-semibold flex items-center justify-center shrink-0">{l.size}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[0.72rem] font-semibold text-ink truncate">Sagada Heirloom</span>
                        <span className="block text-[0.62rem] text-mist">{`${l.size} · ${l.grind}`}</span>
                        <span className="block text-[0.68rem] font-medium text-ink tabular-nums">{peso(PRICE[l.size] * l.qty)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <button type="button" onClick={() => changeQty(l.key, -1)} className="w-6 h-6 rounded-md bg-raised text-ink flex items-center justify-center cursor-pointer" aria-label="One fewer">
                          <Minus size={12} />
                        </button>
                        <span className="w-4 text-center text-[0.72rem] font-semibold text-ink tabular-nums">{l.qty}</span>
                        <button type="button" onClick={() => changeQty(l.key, 1)} className="w-6 h-6 rounded-md bg-raised text-ink flex items-center justify-center cursor-pointer" aria-label="One more">
                          <Plus size={12} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-gold-wash px-3 py-2.5">
                  <div className="text-[0.66rem] font-medium text-gold">{subtotal >= FREE_OVER ? "You get free standard shipping" : `Add ${peso(FREE_OVER - subtotal)} for free shipping`}</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-sheet overflow-hidden">
                    <motion.div className="h-full bg-gold rounded-full" initial={false} animate={{ width: `${Math.min(100, (subtotal / FREE_OVER) * 100)}%` }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-[0.74rem]">
                  <span className="text-graphite">Subtotal</span>
                  <span className="font-semibold text-ink tabular-nums">{peso(subtotal)}</span>
                </div>
                <Button onClick={() => setView("checkout")}>Checkout</Button>
                <button type="button" onClick={() => setView("product")} className="mt-2 w-full text-center text-[0.7rem] font-semibold text-gold cursor-pointer">
                  Keep shopping
                </button>
              </>
            )}
          </Body>
        </>
      )}

      {view === "checkout" && (
        <>
          <Header title="Checkout" sub="Joy Santiago · 0917 555 0142" onBack={() => setView("cart")} />
          <Body>
            <Label>Deliver to</Label>
            <Choice options={ADDRESSES} value={address} onChange={setAddress} />
            <Label>Delivery</Label>
            <Chips options={["Standard", "Same day"]} value={delivery} onChange={setDelivery} />
            <div className="mt-1.5 text-[0.62rem] text-mist">{delivery === "Same day" ? "Grab Express · today by 6 PM · ₱220" : `J&T Express · Oct 30–31 · ${subtotal >= FREE_OVER ? "free" : "₱120"}`}</div>
            <Label>Pay with</Label>
            <Choice options={PAY} value={pay} onChange={setPay} />
            <div className="mt-4 rounded-xl border border-rule bg-sheet p-3 flex flex-col gap-1 text-[0.7rem]">
              <div className="flex justify-between">
                <span className="text-graphite">{`Subtotal · ${items} ${items === 1 ? "item" : "items"}`}</span>
                <span className="text-ink tabular-nums">{peso(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite">Shipping</span>
                <span className="text-ink tabular-nums">{shipping ? peso(shipping) : "Free"}</span>
              </div>
              <div className="flex justify-between pt-1 mt-0.5 border-t border-rule">
                <span className="font-semibold text-ink">Total</span>
                <span className="font-bold text-ink tabular-nums">{peso(total)}</span>
              </div>
              <div className="text-[0.58rem] text-mist">Includes VAT</div>
            </div>
            <Button onClick={placeOrder} disabled={!cart.length}>
              Pay {peso(total)}
            </Button>
          </Body>
        </>
      )}

      {view === "done" && (
        <Body>
          <Done
            title="Order confirmed"
            lines={[
              `Order #${orderNo}`,
              `${peso(placed.total)} paid with ${placed.pay}`,
              placed.delivery === "Same day" ? "Arrives today by 6 PM via Grab" : "Arrives Oct 30–31 via J&T Express",
              "Receipt sent to joy.santiago@gmail.com",
            ]}
            action="Keep shopping"
            onDone={keepShopping}
          />
        </Body>
      )}

      <TabBar
        items={[
          [Home, "Shop"],
          [Search, "Search"],
          [ShoppingBag, "Cart"],
          [User, "Account"],
        ]}
        active={view === "cart" || view === "checkout" ? 2 : 0}
      />
    </>
  );
}
