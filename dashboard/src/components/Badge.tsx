/**
 * This is a generic badge component.
 * By passing props you can customize the badge.
 * The basic custom types are:
 * warning, success, error, info, default.
 * You can use this badge like any other html element.
 *
 * behind the scenes, it uses tailwindcss classes to imlement the badge,
 * with the correct styles.
 *
 * @example
 * <Badge type="warning">Warning</Badge>
 *
 * @param {string} type - The type of the badge.
 * @param {string} children - The content of the badge.
 * @returns {JSX.Element} - The badge component.
 *
 *
 */

import React from "react";
import { BadgeCode } from "../global";

export const BadgeCodes = Object.freeze({
  ERROR: "error",
  WARNING: "warning",
  SUCCESS: "success",
  INFO: "info",
  DEFAULT: "default",
  UNKNOWN: "unknown",
});

export interface BadgeProps {
  type: BadgeCode;
  children: React.ReactNode;
  additionalClassNames?: string;
}
export default function Badge(props: BadgeProps): JSX.Element {
  const colorVariants = {
    [BadgeCodes.ERROR]: "bg-failed text-white",
    [BadgeCodes.WARNING]: "bg-[#ffa800] text-white",
    [BadgeCodes.SUCCESS]: "bg-[#00c2ab] text-black-50 text-black-800",
    [BadgeCodes.INFO]: "bg-blue-200 text-black-800",
    [BadgeCodes.DEFAULT]: "text-black-800",
    [BadgeCodes.UNKNOWN]: "text-failed bg-zinc-200",
  };

  const badgeBase =
    "inline-flex items-center px-2.5 py-0.5 rounded text-sm font-light h-[30px]";
  // the type of the badge is indicated by "type" prop.
  // the default type is "default".
  // the resulting span element is stored in badge_elem.
  const badgeElem = (
    <span
      className={`${badgeBase} ${colorVariants[props.type]} ${
        props.additionalClassNames ?? ""
      }`}
    >
      {props.children}
    </span>
  );
  return badgeElem;
}

export const getBadgeType = (status: string) => {
  if (status === "Unknown") {
    return BadgeCodes.UNKNOWN;
  } else if (
    status === "Healthy" ||
    status.toLowerCase().includes("exists") ||
    status === "available"
  ) {
    return BadgeCodes.SUCCESS;
  } else if (status === "Progressing") {
    return BadgeCodes.WARNING;
  } else {
    return BadgeCodes.ERROR;
  }
};
