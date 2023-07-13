export type Loadable<T> = {
    state: 'loading'
} | {
    state: 'hasValue',
    value: T
} | {
    state: 'error',
    error: string
}