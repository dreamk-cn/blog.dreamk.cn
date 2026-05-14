export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Dreamk",
  avatar: "/avatar.jpg",
  description: "Dreamk 的个人技术博客，记录 Web 开发、Next.js、React 与设计实践。",
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
