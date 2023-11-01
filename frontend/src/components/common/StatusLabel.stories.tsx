import { Meta } from "@storybook/react";
import StatusLabel, { DeploymentStatus } from "./StatusLabel";

const meta = {
  title: "StatusLabel",
  component: StatusLabel,
} satisfies Meta<typeof StatusLabel>;

export default meta;

export const Deployed = {
  args: {
    status: DeploymentStatus.DEPLOYED,
    isRollback: false,
  },
};

export const Failed = {
  args: {
    status: DeploymentStatus.FAILED,
    isRollback: false,
  },
};

export const Pending = {
  args: {
    status: DeploymentStatus.PENDING,
    isRollback: false,
  },
};

export const Superseded = {
  args: {
    status: DeploymentStatus.SUPERSEDED,
    isRollback: false,
  },
};
