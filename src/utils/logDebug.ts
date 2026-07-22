/** console.log wrapper that only fires in development builds. */
export function logDebug(...args: unknown[]) {
    if (process.env.NODE_ENV === 'development') {
        console.log(...args);
    }
}
