"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { PinPad } from "@/components/PinPad";
import { UserChip } from "@/components/UserChip";
import { useLiveClock, getToday } from "@/lib/time";

const LOGO_PATH_VARIANTS = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 18 },
  },
};

interface UserSelectorProps {
  users: Doc<"users">[];
  onSelectUser: (id: Id<"users">, role: "admin" | "kid") => void;
}

export function UserSelector({ users, onSelectUser }: UserSelectorProps) {
  const createUser = useMutation(api.users.create);
  const [pendingAdmin, setPendingAdmin] = useState<Doc<"users"> | null>(null);
  const clockLabel = useLiveClock();

  const today = getToday();
  const todayDow = new Date().getDay();
  const kidSummaries = useQuery(api.chores.getKidsSummary, { today, todayDow });

  const kids = users.filter((u) => u.role === "kid");
  const admins = users.filter((u) => u.role === "admin");

  const handleSetupFamily = async () => {
    if (admins.length === 0)
      await createUser({ name: "Parent", role: "admin" });
    if (kids.length === 0) {
      await createUser({ name: "Kid 1", role: "kid" });
      await createUser({ name: "Kid 2", role: "kid" });
    }
  };

  return (
    <div className="min-h-svh bg-neutral-50 font-google-sans flex flex-col items-center pb-4 px-4">
      {/* Logo + clock */}
      <div className="flex flex-col items-center gap-12 py-6 w-full">
        <div className="pt-6">
          <motion.svg
            width="220"
            viewBox="0 0 1027 636"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.07, delayChildren: 0.05 },
              },
            }}
          >
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              d="M816.735 287.785L785.347 383.124L753.687 444.091L784.08 509.127L786.703 524.595L808.142 581.581L822.072 614.326L820.173 635.764L759.114 633.141L688.196 468.332L675.622 492.936V588.456L681.412 625.542L677.521 631.513H643.691L618.544 626.447L616.645 621.291L624.967 275.121L627.951 266.348L660.606 266.98L678.879 286.699L681.773 395.788L686.296 408.18L717.323 370.551L750.521 290.408L772.23 264.81H807.418L816.735 287.785Z"
              fill="#171717"
            />
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              d="M95.6133 279.645L150.973 277.021L180.462 285.071L179.104 330.118L171.688 352.731L114.428 347.575V524.595L121.574 624.548L102.669 631.331H61.6016L58.7061 595.24V348.118L44.1426 339.163H10.9453L1.2666 318.269L0 284.981L7.32715 280.368L35.8213 274.488L95.6133 279.645Z"
              fill="#171717"
            />
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              fillRule="evenodd"
              clipRule="evenodd"
              d="M298.779 273.131L310.086 309.313L393.939 600.667L394.573 628.708L320.941 625.813L302.307 600.667L299.141 553.722L293.262 515.278L237.631 513.379L225.509 578.958L222.253 607.271L210.222 630.879L167.164 627.713L149.164 615.321L156.581 591.712L209.589 292.308L228.133 268.519H290.096L298.779 273.131ZM256.626 347.575L245.591 415.597L241.701 438.572V459.92H283.764L264.044 346.309L261.149 342.781L256.626 347.575Z"
              fill="#171717"
            />
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              d="M545.998 287.604L572.772 324.058L576.662 378.963L573.768 384.391L514.609 388.913L509.725 383.033L507.825 351.013L486.387 332.018L479.874 388.913L530.168 425.999L567.436 456.845L570.602 455.85L586.975 508.132V550.646L580.462 580.948L553.687 604.195L507.554 625.813L456.717 630.879L420.082 619.12L403.438 590.355L396.653 545.852L409.95 515.55L440.706 513.288L453.008 537.892L469.019 552.184L473.18 560.324L509.453 554.626L520.489 527.761L506.559 495.378L468.657 457.749L411.217 406.19L397.286 382.4L398.553 343.686L401.81 338.53L432.564 291.312L465.853 277.654L519.855 276.75L545.998 287.604Z"
              fill="#171717"
            />
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              d="M963.456 276.75L987.698 287.604L1010.04 318.269L1018.09 374.35L1015.2 383.033L956.039 388.913L949.254 354.631L929.807 334.641L921.756 344.771L918.499 388.913L977.387 429.527L1008.78 452.864L1012.66 454.854L1026.96 508.132V550.646L1021.08 581.581L994.302 601.301L950.249 625.813L906.197 630.879L869.562 625.181L850.113 598.315L841.158 550.013L852.827 516.906L885.12 515.278L898.418 540.877L915.785 551.731L921.303 563.49L954.591 558.335L962.913 530.022L946.631 493.569L841.882 393.436L839.259 373.445L844.144 332.018L876.527 288.509L909.453 276.388L963.456 276.75Z"
              fill="#171717"
            />
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              d="M342.844 54.918L355.477 62.8652L352.742 103.697L354.328 151.271L357.062 160.479L372.484 174.399L386.922 170.563L390.859 140.254V70.8672L388.891 57.1104L390.859 54.918H416.508L431 59.8506L430.016 65.4414L427.281 78.1572L428.648 172.481L422.414 238.524L413.992 260.832L399.172 274.424L380.961 277L352.742 273.876L327.914 260.832L315.609 240.06L330.266 220.438L345.305 223.727L363.68 240.06H381.891L390.859 220.438L393.758 199.886L392.227 198.68L378.172 202.297L357.062 199.337L339.016 191.445L312 150.064L315.555 66.2637L316.977 53H324.25L342.844 54.918Z"
              fill="#171717"
            />
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              d="M75.0312 42.9355L89.0205 46.1836L90.3896 48.8418V69.3662L104.33 68.874L109.906 86.2979L110.542 101.852L101.737 107.808L84.7646 107.266V141.326L87.4062 179.915L88.8242 207.134L93.667 210.333L101.199 192.564L106.384 189.956L120.862 194.189L131.722 206.199L117.097 236.962L82.1719 244L66.2754 233.959L55.5146 216.683L54.0967 207.331L52.3838 141.326L54.292 105.002L37.7588 101.311L33.2588 94.2227L32.7217 77.3896L39.9111 73.4521L55.3193 72.0732L56.0039 63.3125L54.9766 51.3027L57.2266 42L75.0312 42.9355Z"
              fill="#171717"
            />
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              d="M172.147 77.8477L173.08 79.2666L168.714 179.894L170.479 218.051L173.08 241.581L170.971 243H142.714L140.261 227.835L142.37 212.229L140.801 178.866V76.4287L146.344 75.2061L172.147 77.8477Z"
              fill="#171717"
            />
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              d="M285.184 52.54L292.721 59.9541L290.959 105.568L288.854 145.88L289.589 146.764L287.288 237.55L274.366 242.558L258.947 239.612L227.621 109.251L224.292 108.023V220.709L227.082 238.63L223.265 243L206.818 242.067L195.364 233.867L192.722 218.94V148.188L195.364 138.072V57.5977L207.602 54.0127L243.431 53.2764L248.962 70.9033L261.737 138.072L268.346 97.7617L268.884 52L285.184 52.54Z"
              fill="#171717"
            />
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              d="M716 39.4258L553.333 223L472 120.74L513.899 87.4756L553.333 147.846L667.939 0L716 39.4258Z"
              fill="#171717"
            />
            <motion.path
              variants={LOGO_PATH_VARIANTS}
              d="M178.525 42.1367L178.721 43.4082L176.611 68.4551L167.585 73.0049L150.562 71.9775L139.722 55.4424L140.947 53.2412L144.137 37H161.698L178.525 42.1367Z"
              fill="#171717"
            />
          </motion.svg>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-neutral-400"
        >
          {clockLabel}
        </motion.p>
      </div>

      {users.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-4 flex-1 justify-center"
        >
          <p className="text-neutral-500 text-lg">
            Welcome! Let&apos;s get started.
          </p>
          <button
            onClick={handleSetupFamily}
            className="bg-neutral-950 text-white rounded-lg px-7 py-3.5 text-lg font-medium hover:bg-neutral-800 active:scale-[0.97] transition-transform duration-150"
          >
            Set Up Family
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4 w-full flex-1 py-4">
          {kids.map((kid, i) => {
            const remaining =
              kidSummaries?.find((s) => s.userId === kid._id)?.remaining ??
              null;
            return (
              <motion.button
                key={kid._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 + 0.15 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectUser(kid._id, "kid")}
                className="rounded-4xl flex flex-col justify-between overflow-clip p-4 w-full text-left border-2 border-neutral-500/25"
              >
                <UserChip user={kid} />
                {remaining !== null && (
                  <span className="text-neutral-400 text-sm mt-3 block">
                    {remaining} {remaining === 1 ? "chore" : "chores"} left
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {admins[0] && (
        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 28,
            delay: 0.3,
          }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setPendingAdmin(admins[0])}
          className="flex items-center justify-center bg-neutral-200 gap-2 rounded-full py-4 w-full shrink-0 hover:bg-neutral-300 transition-colors text-neutral-500 mt-2"
        >
          <span className="font-md">Parents</span>
        </motion.button>
      )}

      <AnimatePresence>
        {pendingAdmin && (
          <PinPad
            onSuccess={() => {
              onSelectUser(pendingAdmin._id, "admin");
              setPendingAdmin(null);
            }}
            onCancel={() => setPendingAdmin(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
