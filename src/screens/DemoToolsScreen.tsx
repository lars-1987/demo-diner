import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useDemoControls, useFailureRate } from '@/data/ApiProvider';
import { colors, fonts, radius } from '@/theme';

const FAILURE_RATES = [
  { value: 0, label: 'Off' },
  { value: 0.2, label: '20%' },
  { value: 0.5, label: '50%' },
  { value: 1, label: 'Always' },
];

/** Mock-only controls for reviewers: force failures and un-redeem offers without restarting. */
export function DemoToolsScreen() {
  const demo = useDemoControls();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const failureRate = useFailureRate();
  const [resetting, setResetting] = useState(false);

  if (!demo) return null;

  const reset = async () => {
    setResetting(true);
    await demo.reset();
    // Drop all cached data (not just mark it stale) so nothing from before the
    // reset can be shown again. Screens on display refetch from scratch.
    queryClient.resetQueries();
    setResetting(false);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          Demo tools
        </AppText>
        <AppText variant="small" color={colors.muted}>
          Only in this mock build. Use these to try the loading, error and retry states.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="heading">Simulated failures</AppText>
        <View style={styles.segmented} accessibilityRole="radiogroup">
          {FAILURE_RATES.map((option) => {
            const selected = Math.abs(option.value - failureRate) < 0.001;
            return (
              <Pressable
                key={option.label}
                onPress={() => demo.setFailureRate(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`Failure rate ${option.label}`}
                style={[styles.segment, selected && styles.segmentSelected]}
              >
                <AppText variant="small" style={styles.segmentLabel} color={selected ? colors.white : colors.ink}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="small" color={colors.muted}>
          Each request fails at this rate. Redeems can also succeed on the server but lose their response, to test
          that retrying is safe.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="heading">Redeemed offers</AppText>
        <AppText variant="small" color={colors.muted}>
          Clears everything you’ve redeemed so you can go through the flow again.
        </AppText>
        <Button label="Reset demo data" variant="secondary" onPress={reset} loading={resetting} />
      </View>

      <Button label="Done" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 28, gap: 24 },
  header: { gap: 4 },
  section: { gap: 10 },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segment: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.ink },
  segmentLabel: { fontFamily: fonts.semibold },
});
