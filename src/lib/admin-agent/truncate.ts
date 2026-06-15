const DEFAULT_MAX_BYTES = 8 * 1024;

export function truncateJsonForLlm(value: unknown, maxBytes = DEFAULT_MAX_BYTES): string {
  const json = JSON.stringify(value);
  if (json.length <= maxBytes) {
    return json;
  }

  const suffix = '…[truncated]';
  return `${json.slice(0, maxBytes - suffix.length)}${suffix}`;
}
