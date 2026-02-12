/**
 * Calculate relative time from a timestamp
 * Returns "x minutes ago", "x hours ago", or "x days ago"
 */
export function getRelativeTime(timestamp) {
    if (!timestamp) return null;

    try {
        const now = new Date();
        const created = new Date(timestamp);

        // Calculate difference in milliseconds
        const diffMs = now - created;

        // Convert to different units
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) {
            return 'Just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }
    } catch (e) {
        console.error('Error parsing date:', e);
        return null;
    }
}

/**
 * Check if a job was posted within the last 24 hours
 */
export function isPostedInLast24Hours(timestamp) {
    if (!timestamp) return false;

    try {
        const now = new Date();
        const created = new Date(timestamp);
        const diffHours = (now - created) / (1000 * 60 * 60);

        return diffHours <= 24;
    } catch (e) {
        return false;
    }
}
