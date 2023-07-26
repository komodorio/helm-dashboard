import { useEffect, useRef, useState } from 'react'

export const UserDefinedValues = ({
    initialValue,
    setValues,
}: {
    initialValue: string
    setValues: (val: string) => void
}) => {
    const [localState, setLocalState] = useState(initialValue)

    useEffect(() => {
        setLocalState(initialValue)
    }, [initialValue])

    const prevValueRef = useRef(initialValue)
    const timeoutRef = useRef<any>(null)
    useEffect(() => {
        clearTimeout(timeoutRef.current)
        if (prevValueRef.current !== localState) {
            timeoutRef.current = setTimeout(() => {
                setValues(localState)
                clearTimeout(timeoutRef.current)
            }, 800)
        }
    }, [localState])

    return (
        <div className="w-1/2 ">
            <label
                className="block tracking-wide text-gray-700 text-xl font-medium mb-2"
                htmlFor="grid-user-defined-values"
            >
                User-Defined Values:
            </label>
            <textarea
                value={localState || initialValue}
                onChange={(e) => setLocalState(e.target.value)}
                rows={14}
                className="block p-2.5 w-full text-md text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-none font-monospace"
            ></textarea>
        </div>
    )
}
