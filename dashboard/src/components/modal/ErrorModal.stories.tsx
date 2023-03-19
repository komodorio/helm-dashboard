// Modal.stories.ts|tsx

import { ComponentStory, ComponentMeta } from "@storybook/react";
import ErrorModal from "./ErrorModal";

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: "ErrorModal",
  component: ErrorModal,
} as ComponentMeta<typeof ErrorModal>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof ErrorModal> = (args) => (
  <ErrorModal {...args}/>
);

export const Default = Template.bind({});

Default.args = {
    onClose: ()=>{ console.log('on Close clicked')},
};
