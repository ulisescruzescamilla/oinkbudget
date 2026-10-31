/**
 * PlanCongrats — closing screen of the plan wizard: confetti, a happy pig and
 * a recap of the plan. Ported from the congrats block in `design/src/wizard.jsx`.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HappyOink, Icon, Text } from '@/components/ui';
import { PlanPeriodType } from '@/types/PlanType';
import { cashFormatRounded } from '@/utils/formatting';
import { getPlanPeriod } from '@/utils/plan';
import { useTheme } from '@/styles/useTheme';

export interface PlanCongratsProps {
  period: PlanPeriodType;
  income: number;
  /** Total assigned across the plan's budgets. */
  allocated: number;
  /** Number of budgets the plan created or updated. */
  budgetCount: number;
  /** Amount assigned to savings, when the plan has a savings recurrent budget. */
  savings?: number;
}

const CONFETTI_COLORS = ['#7B4BE0', '#D95FC7', '#F17264', '#169F65', '#E3B341'];
const CONFETTI_PIECES = 16;
/** Distance each piece falls, in px. */
const CONFETTI_FALL = 620;

/** One-shot confetti rain behind the content. */
function Confetti() {
  const progress = useRef(Array.from({ length: CONFETTI_PIECES }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const fall = Animated.parallel(
      progress.map((value, i) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 1600 + (i % 4) * 350,
          delay: (i % 6) * 180,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    );
    fall.start();
    return () => fall.stop();
  }, [progress]);

  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      {progress.map((value, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -12,
            left: `${(i * 6.4 + (i % 3) * 5) % 100}%`,
            width: 9,
            height: 14,
            borderRadius: i % 2 ? 2 : 7,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            opacity: value.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [-20, CONFETTI_FALL] }) },
              { rotate: value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Celebration + summary shown once the plan's budgets are saved. */
export function PlanCongrats({ period, income, allocated, budgetCount, savings }: PlanCongratsProps) {
  const t = useTheme();
  const meta = getPlanPeriod(period);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, [pop]);

  const recap: { label: string; value: string; color?: string; icon?: typeof meta.icon }[] = [
    { label: 'Periodo', value: meta.label, icon: meta.icon },
    { label: 'Ingreso', value: cashFormatRounded(income) },
    { label: 'Presupuestos', value: String(budgetCount) },
    savings != null
      ? { label: 'Ahorro', value: `${income > 0 ? Math.round((savings / income) * 100) : 0}%`, color: t.income }
      : { label: 'Sin asignar', value: cashFormatRounded(Math.max(0, income - allocated)) },
  ];

  return (
    <View className="flex-1 items-center justify-center px-[26px] pb-10 pt-6">
      <Confetti />

      <Animated.View
        className="mb-2 h-[150px] w-[150px] items-center justify-center"
        style={{ opacity: pop, transform: [{ scale: pop }] }}
      >
        <LinearGradient
          colors={t.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 75 }}
        />
        <HappyOink size={104} />
        <View
          className="absolute bottom-1.5 right-1.5 h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: t.income, borderWidth: 4, borderColor: t.surface }}
        >
          <Icon name="check" size={22} strokeWidth={3} color="#fff" />
        </View>
      </Animated.View>

      <Text className="mt-4 text-center font-display text-[27px]">¡Tu plan está listo! 🎉</Text>
      <Text className="mt-2 max-w-[280px] text-center text-[14.5px] font-semi leading-[21px] text-muted">
        Repartiste <Text className="font-strong text-text">{cashFormatRounded(allocated)}</Text> en {budgetCount}{' '}
        {budgetCount === 1 ? 'presupuesto recurrente' : 'presupuestos recurrentes'}. Empecemos a cuidar tu dinero.
      </Text>

      <View className="mt-[22px] w-full flex-row flex-wrap justify-between gap-y-2.5">
        {recap.map((cell) => (
          <View key={cell.label} className="rounded-inner border border-border bg-card px-3.5 py-[13px]" style={{ width: '48.5%' }}>
            <Text className="text-[11px] font-display uppercase text-faint">{cell.label}</Text>
            <View className="mt-1 flex-row items-center gap-[7px]">
              {cell.icon ? <Icon name={cell.icon} size={17} strokeWidth={2.2} color={t.primary} /> : null}
              <Text className="font-display text-[17px]" style={cell.color ? { color: cell.color } : undefined}>
                {cell.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default PlanCongrats;
