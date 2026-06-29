/**
 * HistoryScreen — period balance summary, filters and date-grouped movements.
 * Ported from `design/src/transactions.jsx`, reading the local balances log.
 */
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card, Chip, Field, IconButton, Pill, Text } from '@/components/ui';
import { EmptyState, ManageTxSheet, TransactionRow, balanceSignedAmount } from '@/components/features';
import { Sheet } from '@/components/ui';
import { ScreenLayout } from '@/navigation/ScreenLayout';
import { getBalance } from '@/database/balanceRepository';
import { BalanceType } from '@/types/BalanceType';
import { cashFormat, signedCash } from '@/utils/formatting';

type RangeKey = 'today' | 'week' | 'month' | 'all';
type TypeKey = 'all' | 'in' | 'out';

const RANGES: { value: RangeKey; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'all', label: 'Todo' },
];

/** YYYY-MM-DD key for a balance row. */
const dayKey = (item: BalanceType) => String(item.created_at).slice(0, 10);

/** Whether a row's date falls inside the selected range. */
function inRange(item: BalanceType, range: RangeKey): boolean {
  if (range === 'all') return true;
  const key = dayKey(item);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (range === 'today') return key === today;
  const ref = new Date(now);
  ref.setDate(now.getDate() - (range === 'week' ? 7 : 30));
  return key >= ref.toISOString().slice(0, 10);
}

/** Human label for a day key. */
function dayLabel(key: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  if (key === today) return 'Hoy';
  if (key === yesterday) return 'Ayer';
  return new Date(key).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Movimientos tab. */
export function HistoryScreen() {
  const [all, setAll] = useState<BalanceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<RangeKey>('week');
  const [type, setType] = useState<TypeKey>('all');
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<BalanceType | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = (await getBalance()) ?? [];
    setAll(rows);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      if (!inRange(t, range)) return false;
      if (type === 'in' && t.type !== 'income') return false;
      if (type === 'out' && t.type !== 'expense') return false;
      if (q && !(`${t.description} ${t.budget_name} ${t.account_name}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [all, range, type, query]);

  const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

  const groups = useMemo(() => {
    const map = new Map<string, BalanceType[]>();
    filtered.forEach((t) => {
      const k = dayKey(t);
      map.set(k, [...(map.get(k) ?? []), t]);
    });
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const activeFilters = (type !== 'all' ? 1 : 0);

  return (
    <ScreenLayout eyebrow="Historial" title="Movimientos" refreshing={loading} onRefresh={load}>
      <Card hero>
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-[13px] font-strong text-white/80">Balance del periodo</Text>
            <Text className="mt-0.5 font-display text-[32px] text-white">{signedCash(income - expense)}</Text>
          </View>
          <Pill tone="muted">{filtered.length} mov.</Pill>
        </View>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-[14px] bg-white/20 px-3 py-2.5">
            <Text className="text-[12px] font-strong text-white/90">Ingresos</Text>
            <Text className="mt-0.5 font-display text-[17px] text-white">{cashFormat(income)}</Text>
          </View>
          <View className="flex-1 rounded-[14px] bg-black/20 px-3 py-2.5">
            <Text className="text-[12px] font-strong text-white/90">Gastos</Text>
            <Text className="mt-0.5 font-display text-[17px] text-white">{cashFormat(expense)}</Text>
          </View>
        </View>
      </Card>

      <View className="flex-row items-center gap-2.5">
        <View className="flex-1">
          <Field label="" placeholder="Buscar movimiento…" value={query} onChangeText={setQuery} />
        </View>
        <IconButton icon="filter" solid={activeFilters > 0} onPress={() => setFilterOpen(true)} />
      </View>

      <View className="flex-row flex-wrap gap-2">
        {RANGES.map((r) => (
          <Chip key={r.value} label={r.label} active={range === r.value} onPress={() => setRange(r.value)} />
        ))}
      </View>

      {groups.length === 0 ? (
        <Card>
          <EmptyState icon="search" message="Sin movimientos para estos filtros. Prueba con otro periodo." />
        </Card>
      ) : (
        groups.map(([key, items]) => {
          const net = items.reduce((s, t) => s + balanceSignedAmount(t), 0);
          return (
            <View key={key}>
              <View className="flex-row items-center justify-between px-1 pb-1.5 pt-3">
                <Text className="font-display text-[13px]">{dayLabel(key)}</Text>
                <Text className="font-display text-[12.5px] text-muted">{signedCash(net)}</Text>
              </View>
              <Card flush>
                {items.map((t, i) => (
                  <View key={`${key}-${i}`} style={i > 0 ? { borderTopWidth: 1, borderTopColor: 'transparent' } : undefined}>
                    <TransactionRow item={t} onPress={() => setSelected(t)} />
                  </View>
                ))}
              </Card>
            </View>
          );
        })
      )}

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filtros">
        <View className="gap-[7px] pb-2">
          <Text className="text-[12.5px] font-strong text-muted">Tipo</Text>
          <View className="flex-row flex-wrap gap-2">
            {([['all', 'Todos'], ['in', 'Ingresos'], ['out', 'Gastos']] as [TypeKey, string][]).map(([k, l]) => (
              <Chip key={k} label={l} active={type === k} onPress={() => setType(k)} />
            ))}
          </View>
        </View>
      </Sheet>

      <ManageTxSheet tx={selected} onClose={() => setSelected(null)} />
    </ScreenLayout>
  );
}

export default HistoryScreen;
