import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

const useCustomSearchParams = () => {
  const [search, setSearch] = useSearchParams();
  const searchParamsObject: { [key: string]: string } = useMemo(
    () => Object.fromEntries(new URLSearchParams(search)),
    [search]
  );

  const upsertSearchParams = useCallback(
    (k: string, value: string) => {
      const copySearchParams = new URLSearchParams(search);
      copySearchParams.set(k, value);
      setSearch(copySearchParams);
      return copySearchParams;
    },
    [search, setSearch]
  );

  const removeSearchParam = (k: string) => {
    const copySearchParams = new URLSearchParams(search);
    copySearchParams.delete(k);
    setSearch(copySearchParams);
  };

  return {
    searchParamsObject,
    setSearchParams: setSearch,
    upsertSearchParams,
    removeSearchParam,
  };
};

export default useCustomSearchParams;
