export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "梦刻",
  tagline: "记录 Web 开发与设计实践",
  avatar: "/avatar.jpg",
  description: "梦刻的个人技术博客，记录 Web 开发、Next.js、React 与设计实践。",
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
      label: "关于",
      href: "/about",
    },
  ],
  links: {
    github: "https://github.com/dreamk-cn",
  },
  ICP: '鲁ICP备2020040502号-2'
};
