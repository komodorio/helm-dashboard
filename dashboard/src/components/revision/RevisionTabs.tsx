import Tabs from "../Tabs";
import RevisionNotes from "./RevisionNotes";

const tabs = [
  { label: "Resources", content: <>"Resources"</> },
  { label: "Manifests", content: <>"Manifest"</> },
  { label: "Values", content: <>"first Values"</> },
  { label: "Notes", content: <RevisionNotes /> },
];

function RevisionTabs() {
  return <Tabs tabs={tabs} />;
}

export default RevisionTabs;
