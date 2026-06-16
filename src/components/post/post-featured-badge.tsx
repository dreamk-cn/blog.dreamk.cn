import { PinIcon } from "@/components/icons";

export function PostFeaturedBadge() {
  return (
    <span
      aria-label="置顶文章"
      className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-background/90 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-accent shadow-sm backdrop-blur-md dark:bg-background/80"
    >
      <PinIcon size={11} className="shrink-0 -rotate-12" />
      置顶
    </span>
  );
}
