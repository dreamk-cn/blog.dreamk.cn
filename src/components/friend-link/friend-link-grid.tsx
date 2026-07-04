import { LinkIcon } from "@/components/icons";
import { AppLink } from "@/components/ui/app-link";
import { ClientAvatar, ClientAvatarFallback, ClientAvatarImage, ClientCard, ClientCardBody } from "@/components/ui/heroui-client";
import type { PublicFriendLink } from "@/services/friend-link-service";

function formatLinkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function FriendLinkGrid({ items }: { items: PublicFriendLink[] }) {
  if (items.length === 0) {
    return (
      <ClientCard className="rounded-3xl border border-dashed border-border shadow-sm">
        <ClientCardBody className="py-16 text-center">
          <p className="text-base font-medium text-text-base">还没有友链</p>
          <p className="mt-2 text-sm text-text-muted">成为第一个申请友链的站点吧</p>
        </ClientCardBody>
      </ClientCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <AppLink
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="group relative flex h-full flex-col rounded-3xl border border-border/80 bg-background p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <ClientAvatar
              color="accent"
              className="h-14 w-14 shrink-0 border border-default-200 shadow-sm transition-transform duration-200 group-hover:scale-[1.02]"
            >
              {item.avatar ? <ClientAvatarImage src={item.avatar} alt="" /> : null}
              <ClientAvatarFallback className="text-lg">{item.name.slice(0, 1)}</ClientAvatarFallback>
            </ClientAvatar>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-foreground/10 text-text-muted transition-colors group-hover:border-primary/30 group-hover:text-primary">
              <LinkIcon size={16} />
            </span>
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-2">
            <h2 className="line-clamp-1 text-lg font-semibold text-text-base transition-colors group-hover:text-primary">
              {item.name}
            </h2>
            <p className="line-clamp-2 min-h-11 text-sm leading-relaxed text-text-muted">
              {item.description || "这位朋友还没有留下简介"}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-4 text-xs text-text-sub">
            <span className="truncate">{formatLinkHost(item.url)}</span>
            <span className="text-border">·</span>
            <span className="shrink-0 text-primary/80">访问站点</span>
          </div>
        </AppLink>
      ))}
    </div>
  );
}
