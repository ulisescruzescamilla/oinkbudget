/**
 * PlanWizardScreen — "Armar mi plan": four guided steps (period, accounts,
 * income, split) that end by saving the split as budgets.
 * Ported from `design/src/wizard.jsx`, wired through `usePlanWizard`.
 */
import { useCallback, useState } from 'react';
import { BackHandler, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Heading, IconButton, Sheet, StepProgress, Text } from '@/components/ui';
import {
  NewAccountForm,
  PlanAccountsStep,
  PlanCongrats,
  PlanIncomeStep,
  PlanPeriodStep,
  PlanSplitStep,
} from '@/components/features';
import { PLAN_STEP, usePlanWizard } from '@/hooks/usePlanWizard';
import { AccountType } from '@/types/AccountType';
import { cashFormatRounded } from '@/utils/formatting';
import { sameName } from '@/utils/plan';

/** Heading of each working step, in order. */
const STEPS = [
  { title: '¿Cada cuánto planeas?', sub: 'Elige el periodo de tu plan de presupuesto.' },
  { title: '¿Qué cuentas incluyes?', sub: 'Selecciona el dinero que entra en este plan.' },
  { title: '¿Cuánto ingresa?', sub: 'Captura el ingreso que vas a repartir.' },
  { title: 'Reparte tu ingreso', sub: 'Asigna un monto o porcentaje a cada presupuesto recurrente.' },
];

/** Plan wizard screen. */
export function PlanWizardScreen() {
  const router = useRouter();
  const wizard = usePlanWizard();
  const { step, accountsApi } = wizard;
  const [accountFormOpen, setAccountFormOpen] = useState(false);

  const isDone = step === PLAN_STEP.done;
  const { back } = wizard;

  // Hardware back walks the steps back before it leaves the wizard.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (step === PLAN_STEP.period || step === PLAN_STEP.done) return false;
        back();
        return true;
      });
      return () => sub.remove();
      // `back` only wraps a state setter, so `step` is the one real dependency.
    }, [step])
  );

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const closeAccountForm = () => { setAccountFormOpen(false); accountsApi.clearFieldErrors(); };

  /** Creates the account and adds it to the plan. */
  const createAccount = async (account: AccountType) => {
    const created = await accountsApi.createAccount(account);
    if (created) wizard.selectAccount(created);
    return created;
  };

  if (isDone) {
    const savingsBudget = wizard.recurrentBudgets.find((r) => sameName(r.name, 'Ahorro'));
    const savingsRow = wizard.rows.find((r) => r.recurrent_budget_id === savingsBudget?.id);
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-surface">
        <PlanCongrats
          period={wizard.period}
          income={wizard.income}
          allocated={wizard.allocated}
          budgetCount={wizard.rows.filter((r) => r.amount > 0).length}
          savings={savingsRow?.amount}
        />
        <View className="px-[18px] pb-4 pt-2.5">
          <Button icon="home" block size="lg" onPress={() => router.dismissTo('/')}>
            Ver mi resumen
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const meta = STEPS[step];
  const isSplit = step === PLAN_STEP.split;
  const ctaLabel = !isSplit
    ? 'Continuar'
    : wizard.remaining > 0
      ? `Crear plan · queda ${cashFormatRounded(wizard.remaining)}`
      : 'Crear mi plan';

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-surface">
      <View className="gap-3 px-[18px] pb-3.5 pt-1">
        <View className="flex-row items-center justify-between">
          {step > PLAN_STEP.period ? (
            <IconButton icon="back" onPress={back} accessibilityLabel="Paso anterior" />
          ) : (
            <View className="h-10 w-10" />
          )}
          <Text className="text-[12.5px] font-display uppercase text-muted">
            Paso {step + 1} de {STEPS.length}
          </Text>
          <IconButton icon="close" iconSize={19} onPress={close} accessibilityLabel="Cerrar" />
        </View>
        <StepProgress steps={STEPS.length} current={step} />
        <View className="pt-0.5">
          <Heading className="text-[25px] leading-[28px]">{meta.title}</Heading>
          <Text className="mt-[5px] text-sm font-semi text-muted">{meta.sub}</Text>
        </View>
      </View>

      <ScrollView
        key={step}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {step === PLAN_STEP.period && <PlanPeriodStep period={wizard.period} onChange={wizard.setPeriod} />}
        {step === PLAN_STEP.accounts && (
          <PlanAccountsStep
            accounts={wizard.accounts}
            isSelected={wizard.isSelected}
            onToggle={wizard.toggleAccount}
            total={wizard.accountsTotal}
            onAddAccount={() => { accountsApi.clearFieldErrors(); setAccountFormOpen(true); }}
          />
        )}
        {step === PLAN_STEP.income && (
          <PlanIncomeStep
            income={wizard.income}
            onChange={wizard.setIncome}
            period={wizard.period}
            accountsTotal={wizard.accountsTotal}
          />
        )}
        {isSplit && (
          <PlanSplitStep
            income={wizard.income}
            rows={wizard.rows}
            recurrentBudgets={wizard.recurrentBudgets}
            mode={wizard.mode}
            onModeChange={wizard.setMode}
            onRowChange={wizard.setRowAmount}
            onRemoveRow={wizard.removeRow}
            onAddRow={wizard.addRow}
            onSuggest={wizard.applySuggestion}
            onClear={wizard.clearAmounts}
            onRetryRecurrentBudgets={wizard.refreshRecurrentBudgets}
          />
        )}
      </ScrollView>

      <View className="gap-2 bg-surface px-[18px] pb-4 pt-2.5">
        {wizard.submitError ? (
          <Text className="text-center text-[12px] font-semi text-danger">{wizard.submitError}</Text>
        ) : null}
        <Button
          block
          size="lg"
          iconRight={isSplit ? 'check' : 'arrowright'}
          loading={wizard.saving}
          disabled={!wizard.canContinue}
          onPress={wizard.next}
        >
          {ctaLabel}
        </Button>
      </View>

      <Sheet open={accountFormOpen} onClose={closeAccountForm} title="Nueva cuenta">
        <NewAccountForm
          onSubmit={createAccount}
          onDone={closeAccountForm}
          fieldErrors={accountsApi.fieldErrors}
          errorMessage={accountsApi.error?.message}
          loading={accountsApi.loading}
        />
      </Sheet>
    </SafeAreaView>
  );
}

export default PlanWizardScreen;
