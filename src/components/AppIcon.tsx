type IconName =
  | "arrow-left"
  | "arrow-right"
  | "camera"
  | "clipboard"
  | "edit"
  | "history"
  | "home"
  | "plus"
  | "sparkles"
  | "user";

export function AppIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "camera") return <svg {...common}><path d="M4 7h3l1.4-2h7.2L17 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13" r="3.4" /></svg>;
  if (name === "edit") return <svg {...common}><path d="M13.5 6.5 17.5 10.5" /><path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z" /></svg>;
  if (name === "clipboard") return <svg {...common}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5" /><path d="M9 10h6M9 14h6" /></svg>;
  if (name === "history") return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "user") return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.8-3.5 3.2-5.3 7.5-5.3s6.7 1.8 7.5 5.3" /></svg>;
  if (name === "arrow-left") return <svg {...common}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
  if (name === "arrow-right") return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "sparkles") return <svg {...common}><path d="m12 3 1.25 4.25L17.5 8.5l-4.25 1.25L12 14l-1.25-4.25L6.5 8.5l4.25-1.25L12 3ZM19 15l.6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15Z" /></svg>;
  return <svg {...common}><path d="M5 12h14M12 5v14" /></svg>;
}
