/*
 * @file Badge.stories.tsx
 * @description Badge stories, using Storybook.
 * We create a story for the component badge,
 * and we can use it to test the component in Storybook.
 * There, we can see the component in different states, and
 * play with the props to see how it behaves.
 * We'll use a generic story for the component, and we'll
 * use the args to pass the props.
 * We'll use a template to create the story.
 * Refer to Badge.tsx and the BadgeProps interface to see what props
 * the component accepts. The story works with the same props.
 *
 * @see https://storybook.js.org/docs/react/writing-stories/introduction
 */

import { Meta } from "@storybook/react";
import Badge from "./Badge";

// We set the metadata for the story.
// Refer to https://storybook.js.org/docs/react/writing-stories/introduction
// for more information.
const meta = {
  title: "Badge",
  component: Badge,
  args: {
    type: "success",
    children: "Success",
  },
} satisfies Meta<typeof Badge>;

export default meta;

export const Default = {
  args: {
    type: "success",
    children: "Success",
  },
};
