import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  NavbarItem,
} from "@heroui/react";
import React from "react";
import { signOut, useSession } from "next-auth/react";

export const UserDropdown = () => {
  const session = useSession();

  return (
    <Dropdown>
      <NavbarItem>
        <DropdownTrigger>
          <div className="flex gap-2 items-center cursor-pointer">
            <p>欢迎回来，<span className="text-primary">{session.data?.user.name}</span></p>
            <Avatar
              as='button'
              color='primary'
              size='md'
              src={session.data?.user.image ?? undefined}
            />
          </div>
        </DropdownTrigger>
      </NavbarItem>
      <DropdownMenu
        aria-label='User menu actions'
        onAction={(actionKey) => console.log({ actionKey })}>
        <DropdownItem
          key='profile'
          className='flex flex-col justify-start w-full items-start'>
          <p>{session.data?.user.name}</p>
          <p>{session.data?.user.email}</p>
        </DropdownItem>
        <DropdownItem
          key='logout'
          color='danger'
          className='text-danger'
          onPress={() => signOut()}>
          Log Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
