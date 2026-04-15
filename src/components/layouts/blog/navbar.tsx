'use client'

import {
  Avatar,
  Dropdown,
  SearchField,
} from "@heroui/react";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switcher";
import { LogoIcon } from '@/components/icons';
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export const NavBarUser = () => {
  const { data: session } = useSession()
  const router = useRouter();

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="用户菜单"
        className="inline-flex h-auto min-w-0 items-center border-0 bg-transparent p-0 shadow-none ring-0 hover:bg-default-100 data-[pressed]:bg-default-100"
      >
        <Avatar color="accent" size="md">
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
            <div className="flex flex-col items-center justify-center gap-2">
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
            className={session?.user?.role === 'ADMIN' ? '' : 'hidden'}
            onAction={() => router.push('/admin/dashboard')}
          >
            控制台
          </Dropdown.Item>
          <Dropdown.Item id="signout" textValue="signout" onAction={() => signOut()}>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const searchInput = (
    <SearchField aria-label="站内搜索">
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input aria-label="站内搜索" placeholder="Search..." />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );

  const authButton = (
    session ?
    <NavBarUser /> :
    <NextLink
      className="text-accent"
      href="/auth/signin"
    >
      登录
    </NextLink>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-default-200 bg-background shadow">
      <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <NextLink className="flex items-center justify-start gap-1" href="/">
            <LogoIcon className="dark:invert-90" height={34} width={34} />
            <p className="text-xl font-bold text-inherit">{siteConfig.name}</p>
          </NextLink>
        </div>

        <div className="hidden min-w-[280px] lg:block">{searchInput}</div>

        <div className="hidden items-center gap-4 lg:flex">
          <ThemeSwitch />
          <ul className="ml-2 flex items-center gap-4">
            {siteConfig.navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <NextLink
                    className={clsx(
                      "text-text-muted transition-colors hover:text-accent",
                      active && "font-medium text-primary!",
                    )}
                    href={item.href}
                  >
                    {item.label}
                  </NextLink>
                </li>
              );
            })}
          </ul>
          <div className="text-accent">{authButton}</div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeSwitch />
          <button
            type="button"
            aria-label={isMenuOpen ? "收起菜单" : "展开菜单"}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="rounded-lg border border-default-200 px-2 py-1 text-sm"
          >
            {isMenuOpen ? "关闭" : "菜单"}
          </button>
        </div>
      </nav>

      <>
        <button
          type="button"
          aria-label="关闭菜单遮罩"
          className={clsx(
            "fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 lg:hidden",
            isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setIsMenuOpen(false)}
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
                <NextLink
                  className={clsx(
                    "block rounded-lg px-2 py-1.5 text-text-muted",
                    pathname === item.href && "bg-default-100 text-primary!",
                  )}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </NextLink>
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
