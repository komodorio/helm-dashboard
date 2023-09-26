import { Meta, StoryFn } from "@storybook/react";
import { Troubleshoot } from "./Troubleshoot";

export default {
  title: "Troubleshoot",
  component: Troubleshoot,
} as Meta<typeof Troubleshoot>;

const Template: StoryFn<typeof Troubleshoot> = () => <Troubleshoot />;
export const Default = Template.bind({});
