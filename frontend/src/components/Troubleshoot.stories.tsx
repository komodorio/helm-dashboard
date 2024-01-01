import { Meta, StoryFn } from "@storybook/react";
import { Troubleshoot } from "./Troubleshoot";

const meta = {
  title: "Troubleshoot",
  component: Troubleshoot,
} satisfies Meta<typeof Troubleshoot>;

export default meta;

const Template: StoryFn<typeof Troubleshoot> = () => <Troubleshoot />;

export const Default = {
  render: Template,
};
