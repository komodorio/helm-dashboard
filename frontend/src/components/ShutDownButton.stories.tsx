import { StoryFn, Meta } from "@storybook/react";
import ShutDownButton from "./ShutDownButton";

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "ShutDownButton",
  component: ShutDownButton,
} satisfies Meta<typeof ShutDownButton>;

export default meta;

//👇 We create a “template” of how args map to rendering
const Template: StoryFn<typeof ShutDownButton> = () => <ShutDownButton />;

export const Default = {
  render: Template,
};
