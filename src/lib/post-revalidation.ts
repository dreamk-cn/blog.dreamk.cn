/** 文章写操作后收集需失效缓存的 slug */

export function isPostWithTags(
  value: unknown,
): value is { slug: string; tags: Array<{ slug: string }> } {
  return Boolean(value && typeof value === "object" && "slug" in value && "tags" in value);
}

export function collectTagSlugs(...tagGroups: Array<Array<{ slug: string }> | undefined | null>) {
  const slugs = new Set<string>();
  for (const group of tagGroups) {
    for (const tag of group ?? []) {
      slugs.add(tag.slug);
    }
  }
  return [...slugs];
}

export function collectPostSlugs(
  ...postGroups: Array<Array<{ slug: string }> | { slug: string } | null | undefined>
) {
  const slugs = new Set<string>();
  for (const group of postGroups) {
    if (!group) continue;
    if (Array.isArray(group)) {
      for (const post of group) {
        slugs.add(post.slug);
      }
    } else {
      slugs.add(group.slug);
    }
  }
  return [...slugs];
}
