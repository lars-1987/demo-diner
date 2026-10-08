import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { colors, fonts, radius } from '@/theme';
import { AppText } from './AppText';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  count: number;
}

interface FilterChipsProps<T extends string> {
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function FilterChips<T extends string>({ options, selected, onSelect }: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const active = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${option.label}, ${option.count}`}
            hitSlop={{ top: 6, bottom: 6 }}
            style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
          >
            <AppText variant="small" style={styles.label} color={active ? colors.white : colors.ink}>
              {option.label}
            </AppText>
            <AppText variant="caption" color={active ? 'rgba(255,255,255,0.6)' : colors.muted}>
              {option.count}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipIdle: { backgroundColor: colors.surface, borderColor: colors.line },
  label: { fontFamily: fonts.semibold },
});
