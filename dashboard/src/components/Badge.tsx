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
});

export interface BadgeProps {
  type: BadgeCode;
  children: React.ReactNode;
  additionalClassNames?: string;
}
export default function Badge(props: BadgeProps): JSX.Element {
  const colorVariants = {
    error: "bg-red-500 text-white",
    warning: "bg-yellow-400 text-white",
    success: "bg-green-300 text-black-100 text-black-800",
    info: "bg-blue-200 text-black-800",
    default: "text-black-800",
  };

  const badgeBase =
    "inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium";
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
    return BadgeCodes.INFO;
  } else if (status === "Healthy") {
    return BadgeCodes.SUCCESS;
  } else if (status === "Progressing") {
    return BadgeCodes.WARNING;
  } else {
    return BadgeCodes.ERROR;
  }
};
