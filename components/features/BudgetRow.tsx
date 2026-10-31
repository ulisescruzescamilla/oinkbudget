/**
 * BudgetRow — one budget's share: category tile, name, value and an optional
 * slider. Ported from `design/src/budget-row.jsx`; shared by the plan wizard's
 * split step and the new-budget form.
 */
import { View } from 'react-native';
import { IconButton, IconTile, Slider, Text, cn, type IconName } from '@/components/ui';
import { useTheme } from '@/styles/useTheme';

/** Slider settings for a row; values are in whatever unit the caller edits. */
export interface BudgetRowSlider {
  value: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export interface BudgetRowProps {
  /** Name shown next to the tile. */
  label: string;
  /** Category glyph. */
  icon?: IconName;
  /** Category color, used for the tile and the slider fill. */
  color?: string;
  /** Main figure on the right (e.g. "$1,500" or "25%"). */
  value: string;
  /** Muted figure after the main one (e.g. "15%"). */
  detail?: string;
  /** Omit to show the row without a slider. */
  slider?: BudgetRowSlider;
  /** When set, a remove button is shown. */
  onRemove?: () => void;
  /** Standalone bordered card instead of a row inside a list card. */
  solo?: boolean;
  /** Extra content under the slider (e.g. an amount input). */
  children?: React.ReactNode;
}

/** Row that shows, and optionally edits, one budget's share. */
export function BudgetRow({ label, icon, color, value, detail, slider, onRemove, solo, children }: BudgetRowProps) {
  const t = useTheme();
  return (
    <View className={cn(solo ? 'gap-3 rounded-inner border border-border bg-card p-3.5' : 'gap-2 px-4 py-3.5')}>
      <View className="flex-row items-center gap-[11px]">
        <IconTile icon={icon} bg={color} color={color ? '#FFFFFF' : undefined} size={36} />
        <Text className="min-w-0 flex-1 font-display text-[14.5px]" numberOfLines={1}>
          {label}
        </Text>
        <Text className="font-display text-[16px]">
          {value}
          {detail ? <Text className="text-[11.5px] font-strong text-muted"> · {detail}</Text> : null}
        </Text>
        {onRemove ? (
          <IconButton
            icon="close"
            size={26}
            iconSize={15}
            color={t.faint}
            onPress={onRemove}
            className="rounded-lg border-0 bg-card-2 shadow-none"
            accessibilityLabel={`Quitar ${label}`}
          />
        ) : null}
      </View>
      {slider ? (
        <Slider
          value={Math.min(slider.value, slider.max)}
          max={slider.max}
          step={slider.step}
          color={color ?? t.primary}
          onChange={slider.onChange}
          accessibilityLabel={label}
        />
      ) : null}
      {children}
    </View>
  );
}

export default BudgetRow;
