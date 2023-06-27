import { useSearchParams } from "react-router-dom";
const VIEW_MODE_VIEW_ONLY = 'view';
const VIEW_MODE_DIFF_PREV = 'diff-with-previous';
const VIEW_MODE_DIFF_SPECIFIC = 'diff-with-specific-revision';

enum Mode {
    VIEW_MODE_VIEW_ONLY,
    VIEW_MODE_DIFF_PREV,
    VIEW_MODE_DIFF_SPECIFIC,
}
enum Tab {
    'resources', 'manifests', 'values', 'notes'
}
type searchParamsTypes = {
    mode: Mode;
    tab: Tab;
}

const useCustomSearchParams = () => {
    const [search, setSearch] = useSearchParams();
    const searchAsObject : searchParamsTypes = Object.fromEntries(
      new URLSearchParams(search)
    );

    const addSearchParam = (k : string, value : Mode | Tab) => {
        const copySearchParams = new URLSearchParams(search)
        copySearchParams.set(k, value);
        setSearch(copySearchParams);
    }
  
    return [searchAsObject, setSearch, addSearchParam];
  };

  export default useCustomSearchParams;