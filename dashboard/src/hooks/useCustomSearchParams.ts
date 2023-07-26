import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const useCustomSearchParams = () => {
    const [search, setSearch] = useSearchParams()
    const searchAsObject: { [key: string]: string } = Object.fromEntries(
        new URLSearchParams(search)
    )

  const upsertSearchParams = (k: string, value: string) => {
    const copySearchParams = new URLSearchParams(search);
    copySearchParams.set(k, value);
    setSearch(copySearchParams);
    return copySearchParams;
  };

    const removeSearchParam = (k: string) => {
        const copySearchParams = new URLSearchParams(search)
        copySearchParams.delete(k)
        setSearch(copySearchParams)
    }

    return {
        searchParamsObject: searchAsObject,
        setSearchParams: setSearch,
        upsertSearchParams,
        removeSearchParam,
    }
}

export default useCustomSearchParams
