'use client'

import {
  Avatar,
  Button,
  Dropdown,
  SearchField,
} from "@heroui/react";
import { AppLink } from "@/components/ui/app-link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switcher";
import { LogoIcon, MenuIcon } from '@/components/icons';
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export const NavBarUser = () => {
  const { data: session } = useSession()
  const router = useRouter();

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Avatar
          color="accent"
          size="md"
          className="cursor-pointer hover:bg-default-100 data-[pressed]:bg-default-100"
        >
          {session?.user?.image ? (
            <Avatar.Image src={session.user.image} alt="" />
          ) : null}
          <Avatar.Fallback>{session?.user?.name?.slice(0, 1) ?? "?"}</Avatar.Fallback>
        </Avatar>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu
          aria-label="用户菜单操作"
          disabledKeys={["profile", ...(session?.user?.role === 'ADMIN' ? [] : ["dashboard"])]}
        >
          <Dropdown.Item id="profile" textValue="profile">
            <div className="flex flex-col items-center justify-center gap-2 text-text-base">
              <div className="flex justify-between">
                <p>用户名：</p>
                <p>{session?.user?.name}</p>
              </div>
              <p>{session?.user?.email}</p>
            </div>
          </Dropdown.Item>
          <Dropdown.Item
            id="dashboard"
            textValue="dashboard"
            className={clsx("text-text-muted", session?.user?.role === 'ADMIN' ? '' : 'hidden')}
            onAction={() => router.push('/admin/dashboard')}
          >
            控制台
          </Dropdown.Item>
          <Dropdown.Item id="signout" textValue="signout" className="text-text-muted" onAction={() => signOut()}>
            退出登录
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

export const Navbar = () => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSearchSubmit = (value: string) => {
    const keyword = value.trim();
    const params = new URLSearchParams();
    if (keyword) {
      params.set("keyword", keyword);
    }
    router.push(`/posts${params.toString() ? `?${params.toString()}` : ""}`);
    setIsMenuOpen(false);
  };

  const searchInput = (
    <SearchField
      variant="secondary"
      aria-label="站内搜索"
      value={searchValue}
      onChange={setSearchValue}
      onSubmit={handleSearchSubmit}
    >
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input aria-label="站内搜索" placeholder="搜索..." className="placeholder:text-text-muted text-text-base" />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );

  const authButton = (
    session ?
    <NavBarUser /> :
    <Button onPress={() => router.push("/auth/signin")}>登录</Button>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-default-200 bg-background shadow">
      <nav className="h-16 mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AppLink className="flex items-center justify-start gap-1" href="/">
            <LogoIcon className="dark:invert-90" height={34} width={34} />
            <p className="text-xl font-bold text-text-base">{siteConfig.name}</p>
          </AppLink>
        </div>

        <div className="hidden min-w-[280px] lg:block">{searchInput}</div>

        <div className="hidden items-center gap-4 lg:flex">
          <ThemeSwitch />
          <ul className="ml-2 flex items-center gap-4">
            {siteConfig.navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <AppLink
                    className={clsx(
                      "text-text-muted transition-colors hover:text-accent",
                      active && "font-medium text-primary!",
                    )}
                    href={item.href}
                  >
                    {item.label}
                  </AppLink>
                </li>
              );
            })}
          </ul>
          <div className="text-accent">{authButton}</div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeSwitch />
          <Button
            variant="outline"
            size="sm"
            aria-label={isMenuOpen ? "收起菜单" : "展开菜单"}
            className="min-w-0 px-3"
            onPress={() => setIsMenuOpen((prev) => !prev)}
          >
            <MenuIcon color="current" size={20} />
          </Button>
        </div>
      </nav>

      <>
        <Button
          variant="ghost"
          aria-label="关闭菜单遮罩"
          className={clsx(
            "fixed inset-0 z-40 h-full min-h-full w-full min-w-full max-w-none rounded-none bg-black/30 p-0 transition-opacity duration-200 lg:hidden",
            isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
          onPress={() => setIsMenuOpen(false)}
        />
        <div
          className={clsx(
            "absolute left-4 right-4 top-full z-50 mt-2 rounded-2xl border border-default-200 bg-background p-4 shadow-xl transition-all duration-200 lg:hidden",
            isMenuOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0",
          )}
        >
          <div className="mb-3">{searchInput}</div>
          <ul className="flex flex-col gap-2">
            {siteConfig.navItems.map((item) => (
              <li key={item.href}>
                <AppLink
                  className={clsx(
                    "block rounded-lg px-2 py-1.5 text-text-muted",
                    pathname === item.href && "bg-default-100 text-primary!",
                  )}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </AppLink>
              </li>
            ))}
          </ul>
          <hr className="my-3 border-default-200" />
          <div>{authButton}</div>
        </div>
      </>
    </header>
  );
};
