export function decodeUnixNano(timeUnixNano: string): string {
    const milliseconds = Number(timeUnixNano) / 1_000_000;
    return new Date(milliseconds).toISOString();
}

export function encodeUnixNano(isoTimeString: string): string {
    const milliseconds = new Date(isoTimeString).getTime();
    const nanoseconds = milliseconds * 1_000_000;
    return nanoseconds.toString();
}

export function compareISOTimes(time1: string, time2: string): number {
    const date1 = new Date(time1);
    const date2 = new Date(time2);

    if (date1 < date2) return -1;
    if (date1 > date2) return 1;
    return 0;
}

export function getEarlierTime(time1: string, time2: string): string {
    return compareISOTimes(time1, time2) <= 0 ? time1 : time2;
}

export function getLaterTime(time1: string, time2: string): string {
    return compareISOTimes(time1, time2) >= 0 ? time1 : time2;
}

export function isValidISOTime(timeString: string): boolean {
    try {
        const date = new Date(timeString);
        return !isNaN(date.getTime()) && timeString === date.toISOString();
    } catch {
        return false;
    }
}

export function getTimeDifference(
    start: string | number | Date,
    end: string | number | Date,
): number {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return endTime - startTime;
}
