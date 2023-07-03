// Status.stories.ts|tsx

import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';
import RevisionCard from './RevisionCard';
import { RevisionCardProps } from './RevisionCard';
import '../../index.css'
import {Meta, Story} from '@storybook/react/';
//👇 This default export determines where your story goes in the story list
/*export default {
  /* 👇 The title prop is optional.
  * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
  * to learn how to generate automatic titles
  *
  title: 'Revision Card',
  component: RevisionCard,
  parameters: {
    docs: {
      description: {
        component: `This component is the card that contains the
revision information. It is usually a part of a list of
more revision cards, from which the user can select one. 
It consists of the Status element, the revision number,
the revision age (time since created), the previous version, the current
version, and a symbol in between to indicate if this is
 an update or a downgrade.

## Props
- {string} **revision**: the revision number  
- {Date} **revisionDate**: the revision date, when was it created  
- {string} **previousVersion**: the previous version, e.g. 1.12.31   
- {string} **currentVersion**: the current version e.g. 1.12.32  
- {Function} **onClick**: the function to call when the card is clicked
- {Function} *(optional)* **onRefreshClick**: the function to call when the refresh button is clicked
- {string} **statusCode**: the status code.     
  There are currently 3 supported statuses:    
  **"Deployed"**: the revision is deployed  
  **"Superseded"**: the revision was superseded  
  **"Failed"**: the revision failed to deploy  

*refer to the table for more details on the props.* 
`
        ,
      },
    },
  }
} as ComponentMeta<typeof RevisionCard>;
*/
const Template: ComponentStory<typeof RevisionCard> = (args: RevisionCardProps) => <RevisionCard {...args} />;
export const Default = Template.bind({});
Default.args = {
  revision: '1',
  revisionDate: new Date('2021-01-01 00:00:00'),
  previousVersion: '1.12.31',
  currentVersion: '1.12.32',
  onClick: () => {},
  onRefreshClick: () => {},
  statusCode: 'Deployed',
  isActive: true,
  isRefreshable : false,
}
export default {
title:'Revision Card',
component: RevisionCard,
args: Default.args,
}