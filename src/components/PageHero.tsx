import Image from "next/image";
import { AppIcon, IconName } from "@/components/AppIcon";

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
  return (
    <section className={`page-hero ${tone} ${compact ? "compact" : ""}`}>
      <span className="page-hero-glow" aria-hidden="true" />
      <span className="page-hero-icon" aria-hidden="true">
        {imageSrc ? (
          <Image src={imageSrc} alt="" width={64} height={64} priority />
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
