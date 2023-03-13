// YourComponent.stories.ts|tsx

import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';
import Badge from './Badge';
import { BadgeProps } from './Badge';
import { Story } from '@storybook/react/types-6-0';

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
  * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
  * to learn how to generate automatic titles
  */
  title: 'Badge',
  component: Badge,
} as ComponentMeta<typeof Badge>;
// recall that Badge has 'props' which is of type BadgeProps
// we want to past theme to the story with the name 'Default', so we
// create a template for it.
// we want to declare default values for the props, so we create a
// default args object.
const Template: Story<BadgeProps> = (args) => <Badge props={args} />;
export const Default = Template.bind({});
Default.args = {
  type: 'info',
  children: <><span className='font-semibold'>version: </span>&nbsp;<span> 2.0.3</span></>,
};
