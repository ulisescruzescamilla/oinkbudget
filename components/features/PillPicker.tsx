/**
 * PillPicker — compact selector: the 2 most relevant options as pills plus a
 * "+N" / search-icon ("Ver todas") pill that opens a sheet with every option, searchable once
 * the list is long. Ported from `design/src/picker.jsx`.
 */
import { useRef, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Button, Chip, Icon, IconTile, ModalField, Sheet, Text, cn } from '@/components/ui';
import { useTheme } from '@/styles/useTheme';
import { pushRecentPick, readRecentPicks } from '@/utils/recentPicks';
import type { IconName } from '@/components/ui';

/** One selectable option. */
export interface PillPickerItem {
  id: number;
  name: string;
  icon: IconName;
  /** Secondary line shown in the sheet. */
  sub?: string;
}

export interface PillPickerProps {
  label: string;
  items: PillPickerItem[];
  value: number | null;
  onChange: (id: number) => void;
  /** Identifies this picker's recent options on the device. */
  recentKey: string;
  /** Shows a create action at the bottom of the sheet. */
  onNew?: () => void;
  /** Label of the create action. */
  newLabel?: string;
  /** Validation message shown under the pills. */
  error?: string;
}

/** Pills shown before the rest collapse into the "more" pill. */
const VISIBLE_PILLS = 2;

/** Option count above which the sheet shows the search box. */
const SEARCH_THRESHOLD = 6;

/** Share of the safe-area height the options sheet takes. */
const SHEET_HEIGHT_RATIO = 0.75;

/** Pill selector backed by a searchable sheet. */
export function PillPicker({ label, items, value, onChange, recentKey, onNew, newLabel = 'Nueva', error }: PillPickerProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Fixed height measured inside the safe area, so the sheet never runs under
  // the status bar or the home indicator however long the list is.
  const sheetHeight = Math.round((windowHeight - insets.top - insets.bottom) * SHEET_HEIGHT_RATIO);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<number[]>(() => readRecentPicks(recentKey));
  // Set while the sheet closes on the way to `onNew`, so the two sheets never overlap.
  const newPending = useRef(false);

  const byId = (id: number) => items.find((item) => item.id === id);
  const order = [...recent, ...items.map((item) => item.id)].filter(
    (id, index, all) => all.indexOf(id) === index && byId(id)
  );
  const selected = value != null && byId(value) ? value : null;
  const visible = (selected != null ? [selected, ...order.filter((id) => id !== selected)] : order).slice(0, VISIBLE_PILLS);
  const hidden = items.length - visible.length;

  const search = query.trim().toLowerCase();
  const list = items.filter((item) => !search || item.name.toLowerCase().includes(search));
  const searchable = items.length > SEARCH_THRESHOLD;

  const closeSheet = () => {
    setOpen(false);
    setQuery('');
  };

  /** Runs once the sheet is fully gone, whichever way it was closed. */
  const handleDismiss = () => {
    closeSheet();
    if (newPending.current) {
      newPending.current = false;
      onNew?.();
    }
  };

  const pick = (id: number) => {
    pushRecentPick(recentKey, id);
    onChange(id);
  };

  const pickFromSheet = (id: number) => {
    pick(id);
    setRecent(readRecentPicks(recentKey));
    closeSheet();
  };

  const createNew = () => {
    newPending.current = true;
    closeSheet();
  };

  return (
    <View className="gap-[7px]">
      <Text className="text-[12.5px] font-strong text-muted">{label}</Text>
      <View className="flex-row gap-2 overflow-hidden">
        {visible.map((id) => {
          const item = byId(id)!;
          return (
            <Chip
              key={id}
              label={item.name}
              icon={item.icon}
              active={value === id}
              truncate
              onPress={() => pick(id)}
            />
          );
        })}
        <Chip
          label={hidden > 0 ? `+${hidden}` : undefined}
          accessibilityLabel="Ver todas"
          icon="search"
          dashed
          className="shrink-0"
          onPress={() => setOpen(true)}
        />
      </View>
      {error ? <Text className="text-[12px] font-semi text-danger">{error}</Text> : null}

      <Sheet open={open} onClose={handleDismiss} title={label} snapPoints={[sheetHeight]}>
        {searchable ? (
          <View className="mb-3">
            <ModalField placeholder="Buscar…" value={query} onChangeText={setQuery} autoCorrect={false} />
          </View>
        ) : null}
        <BottomSheetScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-2 gap-1">
            {list.map((item) => {
              const on = value === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => pickFromSheet(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className={cn(
                    'min-h-[52px] flex-row items-center gap-3 rounded-[14px] p-2.5',
                    on ? 'bg-primary-soft' : 'active:bg-card-2'
                  )}
                >
                  <IconTile
                    icon={item.icon}
                    size={36}
                    bg={on ? t.primary : t.card2}
                    color={on ? '#FFFFFF' : t.muted}
                  />
                  <View className="min-w-0 flex-1 gap-0.5">
                    <Text numberOfLines={1} className={cn('text-[15px] font-strong', on && 'text-primary')}>
                      {item.name}
                    </Text>
                    {item.sub ? (
                      <Text numberOfLines={1} className="text-[12px] font-semi text-muted">
                        {item.sub}
                      </Text>
                    ) : null}
                  </View>
                  {on ? <Icon name="check" size={18} strokeWidth={2.6} color={t.primary} /> : null}
                </Pressable>
              );
            })}
            {list.length === 0 ? (
              <Text className="p-[18px] text-center text-[13px] font-strong text-muted">Sin resultados</Text>
            ) : null}
          </View>
          {onNew ? (
            <Button variant="text" icon="plus" block onPress={createNew}>
              {newLabel}
            </Button>
          ) : null}
        </BottomSheetScrollView>
      </Sheet>
    </View>
  );
}

export default PillPicker;
