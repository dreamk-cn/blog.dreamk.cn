export function FriendLinkHero({ count }: { count: number }) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-text-base">友链</h1>
      <p className="text-sm text-text-muted">
        共 {count} 个友链 · 欢迎互换链接，可在下方提交申请
      </p>
    </div>
  );
}
