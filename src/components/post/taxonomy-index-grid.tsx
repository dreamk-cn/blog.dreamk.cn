import { AppLink } from "@/components/ui/app-link";
import { ClientCard, ClientCardBody } from "@/components/ui/heroui-client";

export type TaxonomyIndexItem = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

type TaxonomyIndexGridProps = {
  title: string;
  description: string;
  items: TaxonomyIndexItem[];
  emptyMessage: string;
  buildItemHref: (slug: string) => string;
};

export function TaxonomyIndexGrid({
  title,
  description,
  items,
  emptyMessage,
  buildItemHref,
}: TaxonomyIndexGridProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text-base">{title}</h1>
        <p className="text-sm text-text-muted">{description}</p>

        {items.length === 0 ? (
          <ClientCard className="shadow-sm">
            <ClientCardBody className="py-10 text-center text-text-muted">{emptyMessage}</ClientCardBody>
          </ClientCard>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <AppLink
                key={item.id}
                href={buildItemHref(item.slug)}
                className="rounded-xl border border-border bg-background p-5 shadow-sm transition-colors hover:border-primary"
              >
                <div className="space-y-2">
                  <h2 className="line-clamp-1 text-lg font-semibold text-text-base">{item.name}</h2>
                  <p className="text-sm text-text-muted">共 {item.postCount} 篇文章</p>
                </div>
              </AppLink>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
