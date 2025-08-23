
const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

export function formatRelativeTime(timestamp: number): string {
    const secondsAgo = Math.round((Date.now() - timestamp) / 1000);

    if (secondsAgo < MINUTE) {
        return `${secondsAgo}s ago`;
    } else if (secondsAgo < HOUR) {
        return `${Math.floor(secondsAgo / MINUTE)}m ago`;
    } else if (secondsAgo < DAY) {
        return `${Math.floor(secondsAgo / HOUR)}h ago`;
    } else if (secondsAgo < WEEK) {
        return `${Math.floor(secondsAgo / DAY)}d ago`;
    } else if (secondsAgo < MONTH) {
        return `${Math.floor(secondsAgo / WEEK)}w ago`;
    } else if (secondsAgo < YEAR) {
        return `${Math.floor(secondsAgo / MONTH)}mo ago`;
    } else {
        return `${Math.floor(secondsAgo / YEAR)}y ago`;
    }
}
