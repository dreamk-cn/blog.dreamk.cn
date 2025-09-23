export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Dreamk",
  avatar: "/avatar.jpg",
  description: "Dreamk's Blog",
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
