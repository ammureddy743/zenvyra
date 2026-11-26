"use client";

import { useState } from "react";
import {
  ArrowRight,
  Eraser,
  Loader2,
  Maximize2,
  Scissors,
  UserSquare2,
  Wand2,
} from "lucide-react";
import { useToolHandoff } from "./ToolHandoffContext";

export type StudioToolId =
  | "background-remover"
  | "upscaler"
  | "object-remover"
  | "photo-restorer"
  | "passport-maker"
  | "image-generator";

const TARGET_TOOLS: {
  id: StudioToolId;
  label: string;
  href: string;
  icon: typeof Scissors;
}[] = [
  {
    id: "background-remover",
    label: "Bg Remover",
    href: "/tools/background-remover",
    icon: Scissors,
  },
  {
    id: "upscaler",
    label: "Upscale 4×",
    href: "/tools/upscaler",
    icon: Maximize2,
  },
  {
    id: "object-remover",
    label: "Erase Object",
    href: "/tools/object-remover",
    icon: Eraser,
  },
  {
    id: "photo-restorer",
    label: "Restore",
    href: "/tools/photo-restorer",
    icon: Wand2,
  },
  {
    id: "passport-maker",
    label: "Passport",
    href: "/tools/passport-maker",
    icon: UserSquare2,
  },
];

interface SendToToolBarProps {
  imageUrl: string;
  filename?: string;
  currentTool: StudioToolId;
}

export function SendToToolBar({
  imageUrl,
  filename = "zenvyra-edit.png",
  currentTool,
}: SendToToolBarProps) {
  const { sendToTool } = useToolHandoff();
  const [routingTo, setRoutingTo] = useState<string | null>(null);

  const options = TARGET_TOOLS.filter((t) => t.id !== currentTool);

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3.5 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        <ArrowRight className="h-3.5 w-3.5 text-violet-500" />
        Continue Editing In
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((tool) => {
          const Icon = tool.icon;
          const busy = routingTo === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              disabled={routingTo !== null}
              onClick={async () => {
                setRoutingTo(tool.id);
                await sendToTool(imageUrl, filename, tool.href);
                setRoutingTo(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3 text-violet-500" />
              )}
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
