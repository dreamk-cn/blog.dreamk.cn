export const TAG_COLOR_PALETTE = [
  "accent",
  "default",
  "success",
  "warning",
  "danger",
] as const;

export type TagColor = (typeof TAG_COLOR_PALETTE)[number];

function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

export function getTagColor(tagName: string): TagColor {
  const normalized = tagName.trim().toLowerCase();
  const index = hashString(normalized) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
}
