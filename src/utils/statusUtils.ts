/**
 * Status utility functions for calculating user presence and availability
 */

interface StatusIndicator {
  color: string;
  text: string;
}

interface StatusResult {
  statusIndicator: StatusIndicator | null;
  lastSeenText: string | null;
}

/**
 * Calculate status indicator and last seen text based on user preferences and activity
 */
export const calculateStatusIndicator = (
  showStatus: boolean,
  lastSeenTimestamp: string | null | undefined,
  userStatus: string
): StatusResult => {
  // If user has hidden their status
  if (!showStatus) {
    return {
      statusIndicator: null,
      lastSeenText: "Active recently"
    };
  }

  // If no last seen data available
  if (!lastSeenTimestamp) {
    return {
      statusIndicator: null,
      lastSeenText: "Active recently"
    };
  }

  const lastSeenDate = new Date(lastSeenTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  // Currently active (within 2 minutes)
  if (diffMins < 2) {
    if (userStatus === 'away') {
      return {
        statusIndicator: {
          color: "text-yellow-500",
          text: "Away"
        },
        lastSeenText: null
      };
    } else {
      return {
        statusIndicator: {
          color: "text-green-500",
          text: "Online"
        },
        lastSeenText: null
      };
    }
  }

  // Less than 1 hour ago
  if (diffMins < 60) {
    return {
      statusIndicator: null,
      lastSeenText: `Last seen ${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    };
  }

  // Less than 24 hours ago
  if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return {
      statusIndicator: null,
      lastSeenText: `Last seen ${hours} hour${hours !== 1 ? 's' : ''} ago`
    };
  }

  // Yesterday
  if (diffMins < 2880) {
    return {
      statusIndicator: null,
      lastSeenText: "Last seen yesterday"
    };
  }

  // Older
  const dateStr = lastSeenDate.toLocaleDateString();
  return {
    statusIndicator: null,
    lastSeenText: `Last seen on ${dateStr}`
  };
};

/**
 * Format last seen timestamp into human-readable text
 */
export const formatLastSeen = (lastSeenTimestamp: string | null): string => {
  if (!lastSeenTimestamp) {
    return "Active recently";
  }

  const lastSeenDate = new Date(lastSeenTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 2) return "Online";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(diffMins / 60);
  if (diffMins < 1440) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  if (diffMins < 2880) return "yesterday";
  
  return lastSeenDate.toLocaleDateString();
};
