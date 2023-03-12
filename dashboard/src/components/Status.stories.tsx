// Status.stories.ts|tsx

import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';
import Status from './Status';

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
  * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
  * to learn how to generate automatic titles
  */
  title: 'Status',
  component: Status,
} as ComponentMeta<typeof Status>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Status> = (args) => <Status {...args} />;

export const FirstStory = Template.bind({});

FirstStory.args = { 
};