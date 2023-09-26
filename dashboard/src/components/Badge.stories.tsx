/*
 * @file Badge.stories.tsx
 * @description Badge stories, using Storybook.
 * We create a story for the componenet badge,
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

import { ComponentStory } from "@storybook/react";
import Badge, { BadgeProps } from "./Badge";

// We create a generic template for the component.

const Template: ComponentStory<typeof Badge> = (args: BadgeProps) => (
  <Badge {...args} />
);
// We export the story, and we pass the template to it. For now,
// we are only going to use the default story.
export const Default = Template.bind({});
// We set the props for the story. Recall that the props are the same as the
// ones in BadgeProps, which we impoted.
Default.args = {
  type: "success",
  children: "Success",
};
// We set the metadata for the story.
// Refer to https://storybook.js.org/docs/react/writing-stories/introduction
// for more information.
export default {
  title: "Badge",
  component: Badge,
  args: {
    type: "success",
    children: "Success",
  },
};
