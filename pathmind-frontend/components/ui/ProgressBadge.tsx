import { Badge } from "./Badge";

export type NodeState = "locked" | "active" | "completed";

const CONFIG: Record<NodeState, { tone: "neutral" | "brand" | "success"; label: string; icon: string }> = {
  locked: { tone: "neutral", label: "Locked", icon: "🔒" },
  active: { tone: "brand", label: "In progress", icon: "◎" },
  completed: { tone: "success", label: "Completed", icon: "✓" },
};

export function ProgressBadge({ state }: { state: NodeState }) {
  const { tone, label, icon } = CONFIG[state];
  return (
    <Badge tone={tone} icon={<span aria-hidden>{icon}</span>}>
      {label}
    </Badge>
  );
}
