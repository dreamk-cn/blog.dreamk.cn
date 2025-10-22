'use client'

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switcher";
import { SearchIcon, LogoIcon } from '@/components/icons';
import { signOut, useSession } from "next-auth/react";
import { Avatar, Divider, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export const NavBarUser = () => {
  const { data: session } = useSession()
  
  return (
    <Dropdown>
      <DropdownTrigger>
        <div className="flex gap-2 items-center justify-center">
          <Avatar src={session?.user?.image || undefined} color="primary" />
        </div>
      </DropdownTrigger>
      <DropdownMenu disabledKeys={["profile", ...(session?.user?.role === 'ADMIN' ? [] : ["dashboard"])]}>
        <DropdownItem textValue="profile" key="profile">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex justify-between">
              <p>用户名：</p>
              <p>{session?.user?.name}</p>
            </div>
            <p>{session?.user?.email}</p>
          </div>
        </DropdownItem>
        <DropdownItem
          textValue="dashboard"
          key="dashboard"
          className={session?.user?.role === 'ADMIN' ? '' : 'hidden'}
        >
          <Link
            color="primary"
            href="/admin/dashboard"
            size="lg"
            className="flex gap-2"
          >
            控制台
          </Link>
        </DropdownItem>
        <DropdownItem textValue="signout" key="signout">
          <Link
            color="danger"
            onPress={() => signOut()}
            href="void(0)"
            size="lg"
            className="flex gap-2"
          >
            退出登录
          </Link>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

export const Navbar = () => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={['shift']}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  const authButton = (
    session ? 
    <NavBarUser /> :
    <Link
      color="primary"
      href="/auth/signin"
      size="lg"
    >
      登录
    </Link>
  )

  return (
    <HeroUINavbar className="shadow" maxWidth="xl" position="sticky" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
      {/* Logo */}
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <LogoIcon className="dark:invert-90" height={34} width={34} />
            <p className="font-bold text-inherit text-xl">{ siteConfig.name}</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* 桌面端菜单 */}
      <NavbarContent
        className="hidden lg:flex basis-1/5 lg:basis-full" justify="end"
      >
        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>
        <NavbarItem className="hidden lg:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
        <NavbarItem className="hidden lg:flex text-primary cursor-pointer">
          { authButton }
        </NavbarItem>
      </NavbarContent>
      
      {/* 手机端菜单toggle */}
      <NavbarContent className="lg:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle  />
      </NavbarContent>

      {/* 手机端菜单 */}
      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {searchInput}
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={ item.href === pathname ? "primary" :  "foreground" }
                href={item.href}
                size="lg"
                onPress={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          <Divider />
          <NavbarMenuItem>
            {authButton}
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
