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

export type BadgeCode = "success" | "warning" | "error" | "unknown";

export const BadgeCodes = Object.freeze({
  ERROR: "error",
  WARNING: "warning",
  SUCCESS: "success",
  UNKNOWN: "unknown",
});

export interface BadgeProps {
  type: BadgeCode;
  children: React.ReactNode;
  additionalClassNames?: string;
}
export default function Badge(props: BadgeProps): JSX.Element {
  const colorVariants = {
    [BadgeCodes.SUCCESS]: "bg-text-success text-black-800",
    [BadgeCodes.WARNING]: "bg-text-warning text-white",
    [BadgeCodes.ERROR]: "bg-text-danger text-white",
    [BadgeCodes.UNKNOWN]: "bg-secondary text-danger",
  };

  const badgeBase =
    "inline-flex items-center px-1 py-1 rounded text-xs font-light";

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

export const getBadgeType = (status: string): BadgeCode => {
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
