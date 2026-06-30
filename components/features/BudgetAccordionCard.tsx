/**
 * BudgetAccordionCard — collapsible budget row with progress and stats.
 * Ported from `design/src/budgets.jsx`.
 */
import { Pressable, View } from 'react-native';
import { Button, Card, Icon, IconTile, ProgressBar, Text, type IconName } from '@/components/ui';
import { BudgetType } from '@/types/BudgetType';
import { cashFormat } from '@/utils/formatting';
import { useTheme } from '@/styles/useTheme';

export interface BudgetAccordionCardProps {
  budget: BudgetType;
  /** Whether the card is expanded. */
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Formats a budget period like "4 – 30 jun 2026". */
function formatPeriod(start?: Date, end?: Date): string | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  const month = e.toLocaleDateString('es-MX', { month: 'short' });
  return `${s.getDate()} – ${e.getDate()} ${month} ${e.getFullYear()}`;
}

/** Expandable card representing a single budget. */
export function BudgetAccordionCard({ budget, open, onToggle, onEdit, onDelete }: BudgetAccordionCardProps) {
  const t = useTheme();
  const spent = budget.expense_amount ?? 0;
  const max = budget.max_limit;
  const avail = max - spent;
  const pct = max > 0 ? Math.round((spent / max) * 100) : 0;
  const over = avail <= 0;
  const period = formatPeriod(budget.start_date, budget.end_date);

  return (
    <Card flush>
      <Pressable className="flex-row items-center gap-3 px-4 py-4" onPress={onToggle}>
        <IconTile
          color='white'
          icon={budget.category?.icon_code as IconName | undefined}
          bg={budget.category?.color}
        />
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-[14.5px]" numberOfLines={1}>
            {budget.name}
          </Text>
          <Text className="mt-0.5 text-[12.5px] font-semi text-muted">
            {cashFormat(spent)} de {cashFormat(max)}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text className="font-display text-[15px]" style={{ color: over ? t.expense : t.text }}>
            {pct}%
          </Text>
          <Icon name={open ? 'chev' : 'chevd'} size={18} color={t.faint} />
        </View>
      </Pressable>

      <View className="px-4 pb-3.5">
        <ProgressBar value={spent} max={max} />
      </View>

      {open && (
        <View className="px-4 pb-4">
          <View className="mb-3.5 flex-row rounded-inner bg-card-2 px-1 py-3">
            {[
              { k: 'Gastado', v: cashFormat(spent), c: t.text, border: true },
              { k: 'Máximo', v: cashFormat(max), c: t.text, border: true },
              { k: 'Restante', v: over ? cashFormat(0) : cashFormat(avail), c: over ? t.expense : t.income, border: false },
            ].map((col) => (
              <View
                key={col.k}
                className="flex-1 items-center"
                style={col.border ? { borderRightWidth: 1, borderRightColor: t.border } : undefined}
              >
                <Text className="text-[12px] font-strong text-muted">{col.k}</Text>
                <Text className="mt-0.5 font-display text-[15px]" style={{ color: col.c }}>
                  {col.v}
                </Text>
              </View>
            ))}
          </View>

          {period && (
            <View className="mb-3.5 flex-row items-center gap-2">
              <Icon name="cal" size={16} strokeWidth={2} color={t.muted} />
              <Text className="text-[13px] font-semi text-muted">
                Periodo: <Text className="font-strong text-text">{period}</Text>
              </Text>
            </View>
          )}

          <View className="flex-row gap-2.5">
            <Button variant="soft" icon="edit" block onPress={onEdit} className="flex-1">
              Editar
            </Button>
            <Button variant="danger-soft" icon="trash" onPress={onDelete} style={{ width: 52 }}>
              {''}
            </Button>
          </View>
        </View>
      )}
    </Card>
  );
}

export default BudgetAccordionCard;
