// Modal.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import Modal, { ModalAction, ModalButtonStyle } from "./Modal";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "Modal",
  component: Modal,
} as ComponentMeta<typeof Modal>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Modal> = (args) => (
  <Modal {...args}>Basic text content</Modal>
);

export const Default = Template.bind({});

const confirmModalActions: ModalAction[] = [
  {
    id: "1",
    text: "Cancel",
    callback: () => {
      console.log("confirmModal: clicked Cancel");
    },
  },
  {
    id: "2",
    text: "Confirm",
    callback: () => {
      console.log("confirmModal: clicked Confirm");
    },
    variant: ModalButtonStyle.info,
  },
];

Default.args = {
  title: "Basic text title",
  isOpen: true,
  actions: confirmModalActions,
};

const customModalActions: ModalAction[] = [
  {
    id: "1",
    text: "custom button 1",
    className:
      "text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800",
    callback: () => {
      console.log("confirmModal: clicked custom button 1");
    },
  },
  {
    id: "2",
    text: "custom button 2",
    callback: () => {
      console.log("confirmModal: clicked custom button 2");
    },
    variant: ModalButtonStyle.error,
  },
];

export const CustomModal: ComponentStory<typeof Modal> = (args) => (
  <Modal {...args}>
    <div>
      <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
        Custom Modal Content
      </p>
      <button
        className="bg-cyan-500 p-2"
        type="button"
        onClick={() => console.log("just a button")}
      >
        Just a button
      </button>
    </div>
  </Modal>
);

CustomModal.args = {
  title: (
    <div>
      Custom <span className="text-red-500"> Title</span>
    </div>
  ),
  isOpen: true,
  actions: customModalActions,
};

export const AutoScrollWhenContentIsMoreThan500Height: ComponentStory<
  typeof Modal
> = (args) => (
  <Modal {...args}>
    <div style={{ height: "1000px", width: "50%", backgroundColor: "skyblue" }}>
      This div height is 1000 px so we can see a vertical scroll to the right of
      it.
    </div>
  </Modal>
);

AutoScrollWhenContentIsMoreThan500Height.args = {
  title: "Auto Scroll when content is more than 500px height",
  isOpen: true,
  actions: confirmModalActions,
};
