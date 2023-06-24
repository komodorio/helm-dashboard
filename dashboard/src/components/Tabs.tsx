import { ReactNode, useState } from "react";

interface Tab {
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  //   activeTab: string;
  //   setActiveTab: (tab: string) => void;
  //   setTabContent: (tab: string) => void;
}

export default function Tabs({
  tabs,
}: // activeTab,
// setActiveTab,
// setTabContent
TabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col">
      <div className="flex pb-4">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            className={`cursor-pointer px-4 py-2 text-sm font-normal text-[#3B3D45] focus:outline-none"  
              ${activeTab === index && "border-b-[3px] border-[#3B3D45]"}
            `}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[activeTab].content}</div>
    </div>
  );
}
