import React from "react";
import { Sidebar } from "./sidebar.styles";
import { CompaniesDropdown } from "./companies-dropdown";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";
import { useSidebarContext } from '../layout-content';
import { usePathname, useRouter } from "next/navigation";
import {
  CategoryIcon,
  CommentIcon,
  DashboardIcon,
  DatabaseIcon,
  LinkIcon,
  PostIcon,
  TagIcon,
  UserIcon
} from "@/components/icons";

export const SidebarWrapper = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebarContext();
  const adminRoutes = React.useMemo(
    () => [
      "/admin/dashboard",
      "/admin/post/create",
      "/admin/post/list",
      "/admin/comment/list",
      "/admin/tag/list",
      "/admin/category/list",
      "/admin/friend-link/list",
      "/admin/user/list",
    ],
    []
  );

  React.useEffect(() => {
    adminRoutes.forEach((route) => router.prefetch(route));
  }, [adminRoutes, router]);

  return (
    <aside className="h-screen z-[20] sticky top-0">
      {collapsed ? (
        <div className={Sidebar.Overlay()} onClick={setCollapsed} />
      ) : null}
      <div
        className={Sidebar({
          collapsed: collapsed,
        })}
      >
        <div className={Sidebar.Header()}>
          <CompaniesDropdown />
        </div>
        <div className="flex flex-col justify-between h-full">
          <div className={Sidebar.Body()}>
            <SidebarItem
              title="仪表盘"
              icon={<DashboardIcon />}
              isActive={pathname === "/admin/dashboard"}
              href="/admin/dashboard"
            />
            <SidebarMenu title="文章和留言-管理">
              <SidebarItem
                isActive={pathname === "/admin/post/create"}
                title="发布文章"
                icon={<PostIcon />}
                href="/admin/post/create"
              />
              <SidebarItem
                isActive={pathname === "/admin/post/list"}
                title="文章管理"
                icon={<PostIcon />}
                href="/admin/post/list"
              />
              <SidebarItem
                isActive={pathname === "/admin/comment/list"}
                title="留言管理"
                icon={<CommentIcon />}
                href="/admin/comment/list"
              />
            </SidebarMenu>

            <SidebarMenu title="分类和标签-管理">
              <SidebarItem
                isActive={pathname === "/admin/tag/list"}
                title="标签管理"
                icon={<TagIcon />}
                href="/admin/tag/list"
              />
              <SidebarItem
                isActive={pathname === "/admin/category/list"}
                title="分类管理"
                icon={<CategoryIcon />}
                href="/admin/category/list"
              />
            </SidebarMenu>

            <SidebarMenu title="系统">
              <SidebarItem
                isActive={pathname === "/admin/friend-link/list"}
                title="友链"
                icon={<LinkIcon />}
                href="/admin/friend-link/list"
              />
              <SidebarItem
                isActive={pathname === "/caches"}
                title="缓存"
                icon={<DatabaseIcon />}
              />
            </SidebarMenu>
            <SidebarItem
              title="用户管理"
              icon={<UserIcon />}
              isActive={pathname === "/admin/user/list"}
              href="/admin/user/list"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
