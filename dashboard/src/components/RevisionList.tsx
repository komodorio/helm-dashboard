

import React from "react";
import { StatusCode } from "../global";
import Status from "./Status";
import { getAge } from '../timeUtils';
import RevisionCard, { RevisionCardProps } from "./RevisionCard";


export interface RevisionListProps {
  cardsProps: RevisionCardProps[]
}

export default function RevisionList(
  props: RevisionListProps
): JSX.Element {
  const listItems = props.cardsProps.map((args: RevisionCardProps) =>
    <div> <RevisionCard {...args} /></div>
  );
  return <div>{listItems}</div>;
}






