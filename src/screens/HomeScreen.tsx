import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { FilterChips, type ChipOption } from '@/components/FilterChips';
import { Icon } from '@/components/Icon';
import { MemberCard } from '@/components/MemberCard';
import { OfferCard } from '@/components/OfferCard';
import { MemberCardSkeleton, OfferCardSkeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState, InlineError } from '@/components/StateViews';
import { useDemoControls, useFailureRate } from '@/data/ApiProvider';
import { useMember, useOffers } from '@/data/loyalty';
import { useNow } from '@/hooks/useNow';
import { countByStatus, getOfferStatus, sortOffers, type OfferStatus } from '@/domain/offers';
import { colors, fonts, radius } from '@/theme';

type Filter = 'all' | OfferStatus;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const demo = useDemoControls();
  const failureRate = useFailureRate();
  const member = useMember();
  const offers = useOffers();
  const [filter, setFilter] = useState<Filter>('all');
  // Tracked separately from isFetching so background refetches don't show the pull spinner.
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const now = useNow();
  const allOffers = sortOffers(offers.data ?? [], now);
  const visibleOffers = filter === 'all' ? allOffers : allOffers.filter((o) => getOfferStatus(o, now) === filter);
  const counts = countByStatus(allOffers, now);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshFailed(false);
    const results = await Promise.all([member.refetch(), offers.refetch()]);
    setRefreshFailed(results.some((r) => r.isError));
    setRefreshing(false);
  };

  const retryAll = () => {
    member.refetch();
    offers.refetch();
  };

  const openDemoTools = () => router.push('/demo-tools');
  const header = <Header onAvatarPress={openDemoTools} />;
  const demoLink = demo && <DemoToolsLink failureRate={failureRate} onPress={openDemoTools} />;

  // Nothing loaded at all (e.g. offline): one clear message instead of two broken sections.
  if (!member.data && !offers.data && member.isError && offers.isError) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {header}
        <ErrorState
          title="We couldn’t load your rewards"
          message="Looks like the kitchen’s running a little slow. Check your connection and give it another go."
          onRetry={retryAll}
          retrying={member.isFetching || offers.isFetching}
        />
        {demoLink}
      </View>
    );
  }

  const chipOptions: ChipOption<Filter>[] = [
    { value: 'all', label: 'All', count: allOffers.length },
    { value: 'available', label: 'Available', count: counts.available },
    { value: 'redeemed', label: 'Redeemed', count: counts.redeemed },
    { value: 'expired', label: 'Expired', count: counts.expired },
  ];

  const listHeader = (
    <View>
      {header}
      <View style={styles.section}>
        {member.data ? (
          <MemberCard member={member.data} />
        ) : member.isError ? (
          <InlineError
            title="Couldn’t load your membership"
            message="Your points are safe. We just can’t show them right now."
            onRetry={() => member.refetch()}
            retrying={member.isFetching}
          />
        ) : (
          <View accessible accessibilityLabel="Loading your membership">
            <MemberCardSkeleton />
          </View>
        )}
      </View>

      {refreshFailed && member.data && offers.data && (
        <View style={styles.refreshBanner} accessibilityLiveRegion="polite">
          <Icon name="alert" size={16} color={colors.red} />
          <AppText variant="small" style={styles.flex}>
            Couldn’t refresh. Showing your last saved offers.
          </AppText>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <AppText variant="title" accessibilityRole="header">
          Your offers
        </AppText>
        {offers.data && (
          <AppText variant="small" color={colors.muted} style={styles.semibold}>
            {counts.available} available
          </AppText>
        )}
      </View>
      {offers.data && offers.data.length > 0 && (
        <View style={styles.chips}>
          <FilterChips options={chipOptions} selected={filter} onSelect={setFilter} />
        </View>
      )}
      {demo && offers.data && offers.data.length > 0 && counts.available === 0 && (
        <View style={[styles.section, styles.allUsed]}>
          <EmptyState
            title="You’ve used every offer"
            message="Nice work. Reset the demo data to go through the redeem flow again."
            actionLabel="Open demo tools"
            onAction={openDemoTools}
          />
        </View>
      )}
    </View>
  );

  const listEmpty = offers.data ? (
    <View style={styles.section}>
      {offers.data.length === 0 ? (
        <EmptyState
          title="No offers right now"
          message="Fresh deals drop every Monday. Pull down to refresh or check back soon."
          actionLabel="Refresh"
          onAction={() => offers.refetch()}
          actionLoading={offers.isFetching}
        />
      ) : (
        <AppText color={colors.muted} style={styles.filterEmpty}>
          No {filter} offers.
        </AppText>
      )}
    </View>
  ) : offers.isError ? (
    <View style={styles.section}>
      <InlineError
        title="Couldn’t load offers"
        message="The request timed out. Your points and offers are safe. Try again in a moment."
        onRetry={() => offers.refetch()}
        retrying={offers.isFetching}
      />
    </View>
  ) : (
    <View style={[styles.section, styles.list]} accessible accessibilityLabel="Loading offers">
      {[170, 140, 190, 120].map((w) => (
        <OfferCardSkeleton key={w} titleWidth={w} />
      ))}
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 32 }}
      data={visibleOffers}
      keyExtractor={(offer) => offer.id}
      renderItem={({ item }) => (
        <View style={styles.section}>
          <OfferCard offer={item} now={now} onPress={() => router.push(`/offers/${item.id}`)} />
        </View>
      )}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      ListFooterComponent={demoLink}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
    />
  );
}

function Header({ onAvatarPress }: { onAvatarPress: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.brand} accessible accessibilityRole="header" accessibilityLabel="Demo Diner">
        <View style={styles.logo}>
          <AppText style={styles.logoText} color={colors.white} maxFontSizeMultiplier={1}>
            DD
          </AppText>
        </View>
        <AppText variant="title" style={styles.brandName}>
          Demo Diner
        </AppText>
      </View>
      <Pressable
        onPress={onAvatarPress}
        accessibilityRole="button"
        accessibilityLabel="Account and demo tools"
        style={styles.avatar}
      >
        <AppText variant="small" color={colors.amber} style={styles.avatarText} maxFontSizeMultiplier={1}>
          AM
        </AppText>
      </Pressable>
    </View>
  );
}

/** Visible entry point to the mock-only demo tools, so reviewers don't have to find the avatar. */
function DemoToolsLink({ failureRate, onPress }: { failureRate: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.demoLink}>
      <Icon name="wrench" size={14} color={colors.muted} />
      <AppText variant="caption" color={colors.muted}>
        Demo tools · {Math.round(failureRate * 100)}% simulated failures
      </AppText>
    </Pressable>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  semibold: { fontFamily: fonts.semibold },
  section: { paddingHorizontal: 16 },
  list: { gap: 12 },
  separator: { height: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontFamily: fonts.display, fontSize: 15, letterSpacing: -0.3 },
  brandName: { fontSize: 21 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.mustardTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 14 },
  refreshBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.redTint,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  chips: { paddingBottom: 14 },
  filterEmpty: { textAlign: 'center', paddingVertical: 24 },
  allUsed: { paddingBottom: 14 },
  demoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    marginTop: 20,
  },
});
