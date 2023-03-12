// Status.stories.ts|tsx

import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';
import RevisionCard from './RevisionCard';


//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
  * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
  * to learn how to generate automatic titles
  */
  title: 'Revision Card',
  component: RevisionCard,
} as ComponentMeta<typeof RevisionCard>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof RevisionCard> = (args) => <RevisionCard {...args} />;

export const FirstStory = Template.bind({});

FirstStory.args = {
    revisionDate: new Date("2021-01-01 00:00:00"),
    currentVersion: "0.11.73",
    previousVersion: "0.10.74",
};