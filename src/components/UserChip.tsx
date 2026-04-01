import Image from "next/image";
import type { Doc } from "../../convex/_generated/dataModel";

export function UserChip({ user }: { user: Doc<"users"> }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-full bg-neutral-900/10 shrink-0 overflow-hidden flex items-center justify-center">
        {user.avatar && (
          <Image
            src={user.avatar}
            alt=""
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <span className="text-2xl font-semibold leading-10 font-google-sans text-neutral-900">
        {user.name}
      </span>
    </div>
  );
}
