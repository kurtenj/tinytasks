"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Check } from "lucide-react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface StoreProps {
  userId: Id<"users">;
  onClose: () => void;
}

function ItemBadge({ equipped, owned, affordable }: { equipped: boolean; owned: boolean; affordable: boolean }) {
  if (equipped) {
    return (
      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-olive-300">
        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
      </div>
    );
  }
  if (!owned) {
    return (
      <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-olive-300 ${affordable ? "bg-stone-950" : "bg-stone-400"}`}>
        <Lock className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
      </div>
    );
  }
  return null;
}

function StoreItem({
  item,
  equipped,
  owned,
  affordable,
  onPress,
}: {
  item: Doc<"storeItems">;
  equipped: boolean;
  owned: boolean;
  affordable: boolean;
  onPress: () => void;
}) {
  const locked = !owned && !affordable;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={locked ? undefined : onPress}
        className={`relative w-[54px] h-[54px] rounded-full flex items-center justify-center overflow-visible transition-transform active:scale-95 ${locked ? "opacity-40 cursor-default" : ""}`}
      >
        {/* Circle background */}
        <div className="w-full h-full rounded-full bg-white/25 overflow-hidden flex items-center justify-center">
          {item.type === "avatar" && item.imageUrl && (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          )}
          {item.type === "theme" && item.value && (
            <div className="w-full h-full rounded-full" style={{ background: item.value }} />
          )}
        </div>
        <ItemBadge equipped={equipped} owned={owned} affordable={affordable} />
      </button>
      {!owned && (
        <span className={`text-[10px] font-semibold ${affordable ? "text-olive-950/60" : "text-olive-950/30"}`}>
          {item.cost}⭐
        </span>
      )}
      {owned && !equipped && (
        <span className="text-[10px] font-semibold text-olive-950/40">owned</span>
      )}
      {equipped && (
        <span className="text-[10px] font-semibold text-emerald-600">on</span>
      )}
    </div>
  );
}

export function Store({ userId, onClose }: StoreProps) {
  const user = useQuery(api.users.get, { id: userId });
  const avatars = useQuery(api.store.listItems, { type: "avatar" });
  const themes = useQuery(api.store.listItems, { type: "theme" });
  const purchases = useQuery(api.store.getUserPurchases, { userId });
  const purchaseOrEquip = useMutation(api.store.purchaseOrEquip);

  const purchasedIds = new Set(purchases?.map((p) => p.itemId) ?? []);
  const points = user?.points ?? 0;

  const handlePress = (item: Doc<"storeItems">) => {
    const owned = purchasedIds.has(item._id);
    const equipped =
      item.type === "avatar"
        ? user?.equippedAvatar === item._id
        : user?.equippedTheme === item._id;
    if (equipped) return;
    if (!owned && points < item.cost) return;
    purchaseOrEquip({ userId, itemId: item._id });
  };

  const renderSection = (
    title: string,
    items: Doc<"storeItems">[] | undefined,
    emptyMsg: string,
    comingSoon = false,
  ) => (
    <div className="flex flex-col gap-3">
      <p className="text-[20px] leading-6 font-medium text-olive-950/50 font-funnel">{title}</p>
      {comingSoon ? (
        <p className="text-sm font-semibold text-olive-950/40">Coming soon</p>
      ) : items === undefined ? null : items.length === 0 ? (
        <p className="text-sm font-semibold text-olive-950/40">{emptyMsg}</p>
      ) : (
        <div className="flex flex-wrap gap-x-[18px] gap-y-5">
          {items.map((item) => {
            const owned = purchasedIds.has(item._id);
            const equipped =
              item.type === "avatar"
                ? user?.equippedAvatar === item._id
                : user?.equippedTheme === item._id;
            return (
              <StoreItem
                key={item._id}
                item={item}
                owned={owned}
                equipped={equipped}
                affordable={points >= item.cost}
                onPress={() => handlePress(item)}
              />
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="fixed inset-0 bg-olive-300 z-50 font-funnel flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-4 flex items-center justify-between">
        <button onClick={onClose} className="active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-stone-950" />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-medium text-stone-950">{points}</span>
          <span className="text-base">⭐</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-10 pb-10 pt-4">
        {renderSection("Avatars", avatars, "No avatars available yet")}
        {renderSection("Themes", themes, "No themes available yet")}
        {renderSection("Effects", [], "", true)}
      </div>
    </motion.div>
  );
}
