import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import RevisionCard from './RevisionCard';
import { RevisionCardProps } from './RevisionCard';
import '../index.css'
import RevisionList, { RevisionListProps } from './RevisionList';

const Template: ComponentStory<typeof RevisionList> = (args: RevisionListProps) => <RevisionList {...args} />;

export const Default: ComponentStory<typeof RevisionList> = Template.bind({});
Default.args = {
  cardsProps: [
    {
      revision: '3',
      revisionDate: new Date('2023-03-01 00:00:00'),
      previousVersion: '1.12.31',
      currentVersion: '1.12.32',
      onClick: () => { },
      onRefreshClick: () => { },
      statusCode: 'Deployed',
      isActive: true,
      isRefreshable: false,
    },
    {
      revision: '2',
      revisionDate: new Date('2023-02-01 00:00:00'),
      previousVersion: '1.12.31',
      currentVersion: '1.12.32',
      onClick: () => { },
      onRefreshClick: () => { },
      statusCode: 'Superseded',
      isActive: true,
      isRefreshable: false,
    },
    {
      revision: '1',
      revisionDate: new Date('2023-01-01 00:00:00'),
      previousVersion: '1.12.31',
      currentVersion: '1.12.32',
      onClick: () => { },
      onRefreshClick: () => { },
      statusCode: 'Superseded',
      isActive: true,
      isRefreshable: false,
    }
  ]
};

export default {
  title: 'Revision List',
  component: RevisionList,
  args: Default.args,
};