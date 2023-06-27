import { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useCustomSearchParams from '../hooks/useCustomSearchParams'

export interface Tab {
  value: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  selectedTab: Tab;
}

export default function Tabs({
  tabs,
  selectedTab,
}: TabsProps
) {
  
  const navigate = useNavigate();
  const {context, namespace, chart, revision} = useParams();
  const [searchParams, setSearchParams, addSearchParam] = useCustomSearchParams();

  const moveTab = (tab : Tab) => {
    addSearchParam('tab', tab.value)
  }

  return (
    <div className="flex flex-col">
      <div className="flex pb-4">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            className={`cursor-pointer px-4 py-2 text-sm font-normal text-[#3B3D45] focus:outline-none"  
              ${selectedTab.value === tab.value && "border-b-[3px] border-[#3B3D45]"}
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
