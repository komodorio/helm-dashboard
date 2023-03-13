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
 * an example for a warning badge implementation using tailwind:
 *
 * <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
 * bg-yellow-100 text-yellow-800">
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

import React from 'react'
// import index.css from the main folder
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: 'error' | 'success' | 'info' | 'default'
  children: React.ReactNode
}
export default function Badge (
  { props }:
  { props: BadgeProps}): JSX.Element {
  const colorVariants = {
    error: 'bg-red-500 text-white',
    success: 'bg-green-300 text-black-100 text-black-800',
    info: 'bg-blue-200 text-black-800',
    default: 'text-black-800'
  }

  const badgeBase = 'inline-flex items-center px-2.5 py-0.5 rounded text-sm'
  // the type of the badge is indicated by "type" prop.
  // the default type is "default".
  // the resulting span element is stored in badge_elem.
  const badgeElem = <span className={`${badgeBase} ${colorVariants[props.type]}`}>{props.children}</span>
  return (
    badgeElem
  )
}
