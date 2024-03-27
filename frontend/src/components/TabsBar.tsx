/**
 * @file TabsBar.tsx
 *
 * This component is the bar that contains the tabs.
 * it gets the tabs as a prop that contains a list with the name of the tabs
 * and the component that should be rendered when the tab is clicked.
 *
 * @param {Array} tabs - the tabs that should be rendered
 * @param {string} activeTab - the name of the active tab
 * @param {Function} setActiveTab - the function that should be called when a tab is clicked
 * @param {Function} setTabContent - the function that should be called when a tab is clicked
 *
 * @returns {JSX.Element} - the tabs bar
 *
 *
 */

interface TabsBarProps {
  tabs: Array<{ name: string; component: JSX.Element }>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setTabContent: (tab: string) => void;
}

export default function TabsBar({
  tabs,
  activeTab,
  setActiveTab,
  setTabContent,
}: TabsBarProps): JSX.Element {
  return (
    <div className="relative">
      {tabs.map((tab) => (
        <div
          className={`tab ${activeTab === tab.name ? "active" : ""}`}
          onClick={() => {
            setActiveTab(tab.name);
            setTabContent(tab.name);
          }}
          key={tab.name}
        >
          {tab.name}
        </div>
      ))}
    </div>
  );
}
