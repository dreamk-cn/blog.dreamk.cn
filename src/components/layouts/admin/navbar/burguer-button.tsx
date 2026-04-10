import React from "react";
import { useSidebarContext } from "../layout-content";
import { StyledBurgerButton } from "./navbar.styles";

export const BurguerButton = () => {
  const { setCollapsed } = useSidebarContext();

  return (
    <div
      className={StyledBurgerButton()}
      // open={collapsed}
      onClick={setCollapsed}
    >
      <div />
      <div />
    </div>
  );
};
