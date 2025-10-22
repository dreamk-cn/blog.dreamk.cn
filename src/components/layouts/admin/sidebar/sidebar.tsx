import React from "react";
import { Sidebar } from "./sidebar.styles";
import { CompaniesDropdown } from "./companies-dropdown";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";
import { useSidebarContext } from '../layout-content';
import { usePathname } from "next/navigation";
import { HomeIcon } from "@/components/icons";
const PaymentsIcon = HomeIcon, AccountsIcon = HomeIcon, CustomersIcon = HomeIcon, DevIcon = HomeIcon, ViewIcon = HomeIcon, SettingsIcon = HomeIcon, ChangeLogIcon = HomeIcon

export const SidebarWrapper = () => {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebarContext();

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
              icon={<HomeIcon />}
              isActive={pathname === "/admin/dashboard"}
              href="/admin/dashboard"
            />
            <SidebarMenu title="文章和留言-管理">
              <SidebarItem
                isActive={pathname === "/post/create"}
                title="发布文章"
                icon={<CustomersIcon />}
                href="/admin/post/create"
              />
              <SidebarItem
                isActive={pathname === "/post"}
                title="文章管理"
                icon={<AccountsIcon />}
                href="/admin/post/list"
              />
              <SidebarItem
                isActive={pathname === "/admin/comment/list"}
                title="留言管理"
                icon={<PaymentsIcon />}
                href="/admin/comment/list"
              />
            </SidebarMenu>

            <SidebarMenu title="分类和标签-管理">
              <SidebarItem
                isActive={pathname === "/admin/tag/list"}
                title="标签管理"
                icon={<DevIcon />}
                href="/admin/tag/list"
              />
              <SidebarItem
                isActive={pathname === "/admin/category/list"}
                title="分类管理"
                icon={<ViewIcon />}
                href="/admin/category/list"
              />
            </SidebarMenu>

            <SidebarMenu title="系统">
              <SidebarItem
                isActive={pathname === "/friend-link"}
                title="友链"
                icon={<SettingsIcon />}
              />
              <SidebarItem
                isActive={pathname === "/caches"}
                title="缓存"
                icon={<ChangeLogIcon />}
              />
            </SidebarMenu>
            <SidebarItem
              title="用户管理"
              icon={<HomeIcon />}
              isActive={pathname === "/admin/user/list"}
              href="/admin/user/list"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
