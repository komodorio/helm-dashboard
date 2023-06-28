import { useSearchParams } from "react-router-dom";
const VIEW_MODE_VIEW_ONLY = 'view';
const VIEW_MODE_DIFF_PREV = 'diff-with-previous';
const VIEW_MODE_DIFF_SPECIFIC = 'diff-with-specific-revision';

const useCustomSearchParams = () => {
    const [search, setSearch] = useSearchParams();
    const searchAsObject : object = Object.fromEntries(
      new URLSearchParams(search)
    );

    const addSearchParam = (k : string, value : string) => {
        const copySearchParams = new URLSearchParams(search)
        copySearchParams.set(k, value);
        setSearch(copySearchParams);
    }
    const removeSearchParam = (k : string) => {
        const copySearchParams = new URLSearchParams(search)
        copySearchParams.delete(k);
        setSearch(copySearchParams);
    }
  
    return {searchParamsObject: searchAsObject, setSearchParams: setSearch, addSearchParam, removeSearchParam};
  };

  export default useCustomSearchParams;