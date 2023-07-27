import { ReactNode } from "react";
import useCustomSearchParams from "../hooks/useCustomSearchParams";

export interface Tab {
  value: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  selectedTab: Tab;
}

export default function Tabs({ tabs, selectedTab }: TabsProps) {
  const { upsertSearchParams } = useCustomSearchParams();

  const moveTab = (tab: Tab) => {
    upsertSearchParams("tab", tab.value);
  };

  return (
    <div className="flex flex-col">
      <div className="flex pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={`cursor-pointer px-4 py-2 text-sm font-normal text-tab-color focus:outline-none"
              ${
                selectedTab.value === tab.value &&
                "border-b-[3px] border-tab-color"
              }
            `}
            onClick={() => moveTab(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{selectedTab.content}</div>
    </div>
  );
}
