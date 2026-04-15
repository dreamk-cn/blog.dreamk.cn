import { Avatar, Dropdown } from "@heroui/react";
import React from "react";
import { signOut, useSession } from "next-auth/react";

export const UserDropdown = () => {
  const session = useSession();

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="用户菜单"
        className="inline-flex h-auto min-w-0 items-center gap-2 border-0 bg-transparent px-2 py-1 shadow-none ring-0 hover:bg-default-100 data-[pressed]:bg-default-100"
      >
        <span className="hidden text-sm sm:inline">
          欢迎回来，<span className="text-accent">{session.data?.user.name}</span>
        </span>
        <Avatar color="accent" size="md">
          {session.data?.user?.image ? (
            <Avatar.Image src={session.data.user.image} alt="" />
          ) : null}
          <Avatar.Fallback>{session.data?.user?.name?.slice(0, 1) ?? "?"}</Avatar.Fallback>
        </Avatar>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu aria-label="User menu actions">
          <Dropdown.Item id="profile" textValue="profile" className="flex flex-col items-start justify-start">
            <p>{session.data?.user.name}</p>
            <p className="text-small text-default-500">{session.data?.user.email}</p>
          </Dropdown.Item>
          <Dropdown.Item
            id="logout"
            textValue="logout"
            className="text-danger"
            onAction={() => signOut()}
          >
            Log Out
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
};
