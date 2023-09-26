import { ComponentStory } from "@storybook/react";
import StatusLabel, { DeploymentStatus } from "./StatusLabel";

export default {
  title: "StatusLabel",
  component: StatusLabel,
};

const Template: ComponentStory<typeof StatusLabel> = (args) => (
  <StatusLabel {...args} />
);

export const Deployed = Template.bind({});

Deployed.args = {
  status: DeploymentStatus.DEPLOYED,
  isRollback: false,
};

export const Failed = Template.bind({});

Failed.args = {
  status: DeploymentStatus.FAILED,
  isRollback: false,
};

export const Pending = Template.bind({});

Pending.args = {
  status: DeploymentStatus.PENDING,
  isRollback: false,
};

export const Superseded = Template.bind({});

Superseded.args = {
  status: DeploymentStatus.SUPERSEDED,
  isRollback: false,
};
