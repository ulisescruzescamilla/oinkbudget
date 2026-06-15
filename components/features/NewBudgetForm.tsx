/**
 * NewBudgetForm — create/edit a budget. Ported from `NewBudgetForm` in
 * `design/src/app.jsx`. Category drives the budget's graph color; the period
 * defaults to the current calendar month.
 */
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Field, Icon, Text } from '@/components/ui';
import { BudgetType } from '@/types/BudgetType';
import { FieldErrors, getFieldError } from '@/utils/errorHandler';
import { CATEGORIES, getCategoryStyle } from '@/styles/categories';
import { useTheme } from '@/styles/useTheme';

/** Selectable budget categories (all defined category names). */
const BUDGET_CATEGORIES = Object.keys(CATEGORIES).filter((c) => c !== 'Ingreso');

export interface NewBudgetFormProps {
  budget?: BudgetType | null;
  onSubmit: (budget: BudgetType) => Promise<BudgetType | undefined>;
  onDone: () => void;
  fieldErrors: FieldErrors | null;
  loading?: boolean;
}

/** Current calendar month bounds. */
function currentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

/** Form for creating or editing a budget. */
export function NewBudgetForm({ budget, onSubmit, onDone, fieldErrors, loading }: NewBudgetFormProps) {
  const t = useTheme();
  const [name, setName] = useState(budget?.name ?? '');
  const [max, setMax] = useState(budget ? String(budget.max_limit) : '');
  const [category, setCategory] = useState(budget?.name && CATEGORIES[budget.name] ? budget.name : 'Mercado');

  useEffect(() => {
    setName(budget?.name ?? '');
    setMax(budget ? String(budget.max_limit) : '');
    setCategory(budget?.name && CATEGORIES[budget.name] ? budget.name : 'Mercado');
  }, [budget]);

  const submit = async () => {
    const color = getCategoryStyle(category).solid;
    const { start, end } = currentMonthRange();
    const result = await onSubmit({
      id: budget?.id ?? null,
      name: name.trim() || category,
      max_limit: parseFloat(max) || 0,
      percentage_value: budget?.percentage_value ?? 0,
      color,
      graph_color: color,
      start_date: budget?.start_date ?? start,
      end_date: budget?.end_date ?? end,
    });
    if (result) onDone();
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <View className="gap-4">
        <Field
          label="Nombre"
          placeholder="Ej. Mercado"
          value={name}
          onChangeText={setName}
          error={getFieldError(fieldErrors ?? undefined, 'name')}
        />

        <Field
          label="Monto máximo"
          placeholder="$0.00"
          keyboardType="decimal-pad"
          value={max}
          onChangeText={setMax}
          error={getFieldError(fieldErrors ?? undefined, 'max_limit')}
        />

        <View className="gap-[7px]">
          <Text className="text-[12.5px] font-strong text-muted">Categoría</Text>
          <View className="flex-row flex-wrap gap-2">
            {BUDGET_CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={c}
                icon={getCategoryStyle(c).icon}
                active={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Icon name="cal" size={16} strokeWidth={2} color={t.muted} />
          <Text className="text-[13px] font-semi text-muted">
            Periodo: <Text className="font-strong text-text">Mensual</Text>
          </Text>
        </View>

        <Button icon="check" block size="lg" loading={loading} onPress={submit}>
          {budget ? 'Guardar cambios' : 'Crear presupuesto'}
        </Button>
      </View>
    </ScrollView>
  );
}

export default NewBudgetForm;
