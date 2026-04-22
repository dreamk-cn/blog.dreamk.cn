import { tv } from "@heroui/react";


// NEEDS TO BE REFACTORED

export const StyledBurgerButton = tv({
  base: "absolute flex h-6 w-6 cursor-pointer flex-col justify-around border-none bg-transparent p-0 text-text-base z-[202] focus:outline-none [&_div]:relative [&_div]:h-px [&_div]:w-6 [&_div]:origin-[1px] [&_div]:rounded-xl [&_div]:bg-current [&_div]:transition-all",

  variants: {
    open: {
      true: "[&",
    },
  },
  //   "",
  //   "& div": {

  //     "&:first-child": {
  //       transform: "translateY(-4px) rotate(0deg)",
  //       height: "1px",
  //       marginTop: "10px",
  //     },
  //     "&:nth-child(2)": {
  //       transform: "translateY(4px) rotate(0deg)",
  //       height: "1px",
  //       marginBottom: "10px",
  //     },
  //   },
  //   variants: {
  //     open: {
  //       true: {
  //         "& div": {
  //           "&:first-child": {
  //             marginTop: "0px",
  //             transform: "translateY(1px) rotate(45deg)",
  //           },
  //           "&:nth-child(2)": {
  //             marginBottom: "0px",
  //             transform: "translateY(4px) rotate(-45deg)",
  //           },
  //         },
  //       },
  //     },
  //   },
});
