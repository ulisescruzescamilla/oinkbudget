import { View, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetType } from '@/types/BudgetType';
import { BalanceType } from '@/types/BalanceType';
import { useCallback, useState } from 'react';
import AddExpense from '@/components/mine/actions/AddExpense';
import { GradientView, PrimaryButton } from '@/components/mine';
import Iconify from 'react-native-iconify';
import AddIncome from '@/components/mine/actions/AddIncome';
import { useFocusEffect } from 'expo-router';
import { getAllBudgets } from '@/database/budgetRepository';
import { getLatestExpenses, getTodayExpensesTotal } from '@/database/balanceRepository';
import { cashFormat } from '@/utils/formatting';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import Svg, { Circle } from 'react-native-svg';

const RING_SIZE = 140;
const STROKE_WIDTH = 14;

function RingChart({ percentage, color }: { percentage: number; color: string }) {
  const radius = (RING_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={STROKE_WIDTH}
        fill="none"
      />
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
      />
    </Svg>
  );
}

export default function Tab() {
  const [toggleAddExpense, setToggleAddExpense] = useState(false);
  const [isIncomeOpen, setIncomeOpen] = useState(false);

  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [latestExpenses, setLatestExpenses] = useState<BalanceType[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getAllBudgets().then(setBudgets);
      getLatestExpenses(5).then((data) => setLatestExpenses(data ?? []));
      getTodayExpensesTotal().then((data) => setTodayTotal(data?.total ?? 0));
    }, [])
  );

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.max_limit, 0);
  const totalRemaining = budgets.reduce((sum, b) => sum + Math.max(b.max_limit - b.expense_amount, 0), 0);
  const todayPercentage = totalBudgetLimit > 0 ? (todayTotal / totalBudgetLimit) * 100 : 0;
  const isOverBudget = todayPercentage >= 100;

  return (
    <SafeAreaView style={styles.container}>
      <AddExpense isOpen={toggleAddExpense} handleClose={setToggleAddExpense} />
      <AddIncome open={isIncomeOpen} handleClose={setIncomeOpen} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <GradientView>
          <Heading className="text-2xl color-white">Dashboard</Heading>
        </GradientView>

        {/* ── Section 1: Today's spending ring ── */}
        <Card size="md" variant="elevated" className="m-4">
          <Heading className="text-base text-zinc-500 mb-3">Gastos de hoy</Heading>
          <View className="flex flex-row items-center gap-4">
            <View style={styles.ringContainer}>
              <RingChart
                percentage={todayPercentage}
                color={isOverBudget ? '#ef4444' : '#8637CF'}
              />
              <View style={styles.ringLabel}>
                <Text className="text-xs text-zinc-400">gastado</Text>
                <Text className={`text-xs font-bold ${isOverBudget ? 'text-red-500' : 'text-purple-700'}`}>
                  {Math.round(todayPercentage)}%
                </Text>
              </View>
            </View>
            <View className="flex-1 gap-2">
              <View>
                <Text className="text-xs text-zinc-400">Total gastado hoy</Text>
                <Heading className={`text-lg ${isOverBudget ? 'text-red-500' : 'text-zinc-800'}`}>
                  {cashFormat(todayTotal)}
                </Heading>
              </View>
              <View>
                <Text className="text-xs text-zinc-400">Límite total de presupuestos</Text>
                <Heading className="text-lg text-zinc-800">{cashFormat(totalBudgetLimit)}</Heading>
              </View>
            </View>
          </View>
        </Card>

        {/* ── Section 2: Remaining per budget ── */}
        <Card size="md" variant="elevated" className="mx-4 mb-4">
          <Heading className="text-base text-zinc-500 mb-3">Disponible por presupuesto</Heading>
          {budgets.length === 0 && (
            <Text className="text-zinc-400 text-sm">Sin presupuestos configurados</Text>
          )}
          {budgets.map((budget, i) => {
            const remaining = Math.max(budget.max_limit - budget.expense_amount, 0);
            const spent = Math.min((budget.expense_amount / budget.max_limit) * 100, 100);
            const isNearLimit = spent >= 80;
            return (
              <View key={i} className="mb-3">
                <View className="flex flex-row justify-between items-center mb-1">
                  <Text className="font-semibold text-zinc-700">{budget.name}</Text>
                  <Text className={`text-sm font-bold ${isNearLimit ? 'text-red-500' : 'text-emerald-600'}`}>
                    {cashFormat(remaining)} disponible
                  </Text>
                </View>
                <Progress id={`remaining-${budget.name}`} value={spent} className="w-full" size="sm">
                  <ProgressFilledTrack className={isNearLimit ? 'bg-red-500' : budget.color} />
                </Progress>
                <Text className="text-xs text-zinc-400 mt-0.5">
                  {cashFormat(budget.expense_amount)} de {cashFormat(budget.max_limit)}
                </Text>
              </View>
            );
          })}
          {budgets.length > 0 && (
            <View className="mt-2 pt-2 border-t border-zinc-100">
              <View className="flex flex-row justify-between">
                <Text className="text-sm text-zinc-500">Total disponible</Text>
                <Text className="text-sm font-bold text-emerald-600">{cashFormat(totalRemaining)}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* ── Section 3: Latest expenses ── */}
        <Card size="md" variant="elevated" className="mx-4 mb-4">
          <Heading className="text-base text-zinc-500 mb-3">Últimos gastos</Heading>
          {latestExpenses.length === 0 && (
            <Text className="text-zinc-400 text-sm">Sin gastos registrados</Text>
          )}
          {latestExpenses.map((item, i) => (
            <View key={i} className="flex flex-row items-center gap-3 py-2 border-b border-zinc-50">
              <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                <Iconify icon="raphael:arrowdown" color="#ef4444" size={16} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-zinc-700" numberOfLines={1}>
                  {item.description || '—'}
                </Text>
                <Text className="text-xs text-zinc-400">
                  {item.budget_name} · {item.account_name}
                </Text>
              </View>
              <Text className="text-sm font-bold text-red-500">-{cashFormat(item.amount)}</Text>
            </View>
          ))}
        </Card>

      </ScrollView>

      {/* Action buttons */}
      <View style={styles.addButton} className="flex flex-row gap-2">
        <View className="w-1/2">
          <PrimaryButton onPress={() => setIncomeOpen(true)}>
            <View className="flex flex-row items-center gap-3 px-2">
              <Iconify icon="tabler:plus" color="white" />
              <Heading className="text-white">Ingreso</Heading>
            </View>
          </PrimaryButton>
        </View>
        <View className="w-1/2">
          <PrimaryButton onPress={() => setToggleAddExpense(true)}>
            <View className="flex flex-row items-center gap-3 px-2">
              <Iconify icon="tabler:plus" color="white" />
              <Heading className="text-white">Gasto</Heading>
            </View>
          </PrimaryButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 8,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    paddingHorizontal: '3%',
    paddingBottom: 8,
    paddingTop: 4,
  },
});
