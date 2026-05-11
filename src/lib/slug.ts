import GithubSlugger from "github-slugger";

export function normalizeSlug(input: string, maxLength = 255) {
  const raw = input.trim();
  if (!raw) return "";

  const asciiSlug = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const slug = asciiSlug || new GithubSlugger().slug(raw);

  return slug
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength);
}
