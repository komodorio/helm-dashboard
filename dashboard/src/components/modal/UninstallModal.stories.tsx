// Modal.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import UninstallModal from "./UninstallModal";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "UninstallModal",
  component: UninstallModal,
} as ComponentMeta<typeof UninstallModal>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof UninstallModal> = (args) => (
  <UninstallModal {...args}></UninstallModal>
);

export const Default = Template.bind({});

Default.args = {
  uninstallTarget: "airflow",
  namespace: "default",
  isOpen: true,
  resources: [
    { id: "1", type: "ServiceAccount", name: "airflow-redis" },
    { id: "2", type: "Secret", name: "postgresql" },
    { id: "3", type: "Secret", name: "airflow-redis" },
    { id: "4", type: "Secret", name: "airflow" },
    { id: "5", type: "ConfigMap", name: "airflow-redis-configuration" },
  ],
};
