export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  /** 页面 UI 展示名（导航、侧边栏等） */
  name: "梦刻",
  /** 浏览器标签与 SEO 完整标题 */
  title: "梦刻 | dreamk",
  /** 品牌标识，与域名 dreamk.cn 对齐，用于 SEO 与结构化数据 */
  slug: "dreamk",
  tagline: "记录 Web 开发与设计实践",
  avatar: "/avatar.jpg",
  description:
    "梦刻（dreamk）个人技术博客，记录 Web 开发、Next.js、React 与设计实践。",
  keywords: ["梦刻", "dreamk", "dreamk.cn", "技术博客", "Web 开发"],
  navItems: [
    {
      label: "首页",
      href: "/",
    },
    {
      label: "分类",
      href: "/categories",
    },
    {
      label: "标签",
      href: "/tags",
    },
    {
      label: "博客",
      href: "/posts",
    },
    {
      label: "友链",
      href: "/links",
    },
    {
      label: "关于",
      href: "/about",
    },
  ],
  links: {
    github: "https://github.com/dreamk-cn",
  },
  ICP: "鲁ICP备2020040502号-2",
};
