import Tabs from "../Tabs";
import RevisionNotes from "./RevisionNotes";

const tabs = [
  { label: "Resources", content: <>"Resources"</> },
  { label: "Manifests", content: <>"Manifest"</> },
  { label: "Values", content: <>"first Values"</> },
  { label: "Notes", content: <RevisionNotes /> },
];

function RevisionTabs() {
  return (
    <div>
      <Tabs tabs={tabs} />
    </div>
  );
}

export default RevisionTabs;
