import Tabs from "../Tabs";
import RevisionDiff from "./RevisionDiff";

const tabs = [
  { label: "Resources", content: <>"Resources"</> },
  { label: "Manifests", content: <RevisionDiff /> },
  { label: "Values", content: <RevisionDiff includeUserDefineOnly={true} /> },
  { label: "Notes", content: <RevisionDiff /> },
];

function RevisionTabs() {
  return <Tabs tabs={tabs} />;
}

export default RevisionTabs;
