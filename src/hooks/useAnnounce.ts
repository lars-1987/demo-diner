import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Reads `message` aloud with VoiceOver/TalkBack whenever it appears or changes.
 * accessibilityLiveRegion only works on Android, so errors need this on iOS.
 */
export function useAnnounce(message: string | null | undefined) {
  useEffect(() => {
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
}
