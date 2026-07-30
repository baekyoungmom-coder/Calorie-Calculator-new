import Image from "next/image";
import { AppIcon, IconName } from "@/components/AppIcon";

const clayIconImages: Partial<Record<IconName, string>> = {
  camera: "/images/ui/clay-camera.png",
  clipboard: "/images/ui/clay-calendar.png",
  edit: "/images/ui/clay-notepad.png",
  history: "/images/ui/clay-clock.png",
  plus: "/images/ui/clay-notepad.png",
  user: "/images/ui/clay-login-profile.png",
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: IconName;
  imageSrc?: string;
  tone?: "mint" | "sky" | "peach" | "lavender";
  compact?: boolean;
};

export function PageHero({
  eyebrow,
  title,
  description,
  icon,
  imageSrc,
  tone = "mint",
  compact = false,
}: PageHeroProps) {
  const resolvedImageSrc = imageSrc ?? clayIconImages[icon];

  return (
    <section className={`page-hero ${tone} ${compact ? "compact" : ""}`}>
      <span className="page-hero-glow" aria-hidden="true" />
      <span className="page-hero-icon" aria-hidden="true">
        {resolvedImageSrc ? (
          <Image src={resolvedImageSrc} alt="" width={64} height={64} priority />
        ) : (
          <AppIcon name={icon} size={compact ? 24 : 29} />
        )}
      </span>
      <div className="page-hero-copy">
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <small>{description}</small>
      </div>
    </section>
  );
}
