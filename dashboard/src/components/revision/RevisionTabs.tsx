import Tabs from "../Tabs";
import RevisionDiff from "./RevisionDiff";
import RevisionResource from "./RevisionResource";

const tabs = [
  { label: "Resources", content: <RevisionResource /> },
  { label: "Manifests", content: <RevisionDiff /> },
  { label: "Values", content: <RevisionDiff includeUserDefineOnly={true} /> },
  { label: "Notes", content: <RevisionDiff /> },
];

function RevisionTabs() {
  return <Tabs tabs={tabs} />;
}

export default RevisionTabs;
