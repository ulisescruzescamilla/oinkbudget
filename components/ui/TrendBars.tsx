/**
 * TrendBars — small N-day bar chart. Ported from the `TrendBars` primitive in
 * `design/src/ui.jsx`. The last bar (today) is highlighted.
 */
import { View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/styles/useTheme';

/** A single bar datum: label `d`, value `v`. */
export interface TrendDatum {
  d: string;
  v: number;
}

export interface TrendBarsProps {
  data: TrendDatum[];
  /** Chart height in px. */
  height?: number;
}

/** Renders an end-aligned mini bar chart. */
export function TrendBars({ data, height = 56 }: TrendBarsProps) {
  const t = useTheme();
  const max = Math.max(...data.map((d) => d.v), 1);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 7, height }}>
      {data.map((d, i) => {
        const isToday = i === data.length - 1;
        const hpx = d.v === 0 ? 4 : Math.max(6, (d.v / max) * height);
        const bg = d.v === 0 ? t.ringTrack : isToday ? t.primary : t.primaryLine;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View style={{ width: '100%', height: hpx, borderRadius: 6, backgroundColor: bg }} />
            <Text
              className="text-[10.5px] font-strong"
              style={{ color: isToday ? t.primary : t.faint }}
            >
              {d.d}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default TrendBars;
