export interface ChorePreset {
  id: string;
  label: string;
  file: string;        // path served from /public/chores/
  color: string;       // background color of the illustration (used immediately, no async)
  lucideIcon: string;  // Lucide icon name for admin list view
}

// Color used for chores with no illustration assigned
export const DEFAULT_CARD_COLOR = "#e7e5e4"; // stone-200

export const CHORE_PRESETS: ChorePreset[] = [
  { id: "trash",    label: "Take Out Trash",  file: "/chores/take-out-trash.png", color: "#90bc40", lucideIcon: "Trash2"          },
  { id: "bed",      label: "Make Your Bed",   file: "/chores/make-bed.png",       color: "#f2a0b5", lucideIcon: "BedDouble"       },
  { id: "dishes",   label: "Do the Dishes",   file: "/chores/dishes.png",         color: "#7dd3fc", lucideIcon: "UtensilsCrossed" },
  { id: "laundry",  label: "Put Away Laundry",file: "/chores/laundry.png",        color: "#c4b5fd", lucideIcon: "Shirt"           },
  { id: "sweep",    label: "Sweep the Floor", file: "/chores/sweep.png",          color: "#fde68a", lucideIcon: "Sparkles"        },
  { id: "bathroom", label: "Clean Bathroom",  file: "/chores/bathroom.png",       color: "#a5f3fc", lucideIcon: "Droplets"        },
  { id: "dog",      label: "Walk the Dog",    file: "/chores/dog.png",            color: "#fcd34d", lucideIcon: "Dog"             },
  { id: "homework", label: "Do Homework",     file: "/chores/homework.png",       color: "#86efac", lucideIcon: "BookOpen"        },
  { id: "plants",   label: "Water Plants",    file: "/chores/plants.png",         color: "#4ade80", lucideIcon: "Leaf"            },
  { id: "tidy",     label: "Tidy Your Room",  file: "/chores/tidy.png",           color: "#fb923c", lucideIcon: "Star"            },
  { id: "teeth",    label: "Brush Teeth",     file: "/chores/teeth.png",          color: "#e0f2fe", lucideIcon: "Smile"           },
  { id: "shower",   label: "Take a Shower",   file: "/chores/shower.png",         color: "#bae6fd", lucideIcon: "ShowerHead"      },
];

export function getPresetByFile(imageUrl: string | undefined): ChorePreset | undefined {
  if (!imageUrl) return undefined;
  return CHORE_PRESETS.find((p) => p.file === imageUrl);
}
