import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { View, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { Card } from '@/components/ui/card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetType } from '@/types/BudgetType';
import { useState } from 'react';
import AddExpense from '@/components/mine/actions/AddExpense';
import { PrimaryButton } from '@/components/mine';
import { Center } from '@/components/ui/center';
import Iconify from 'react-native-iconify';
import AddIncome from '@/components/mine/actions/AddIncome';

const budgets: BudgetType[] = [
  { expense_amount: 50, max_limit: 500, name: 'ropa', percentage_value: 30, color: 'bg-emerald-600' },
  { expense_amount: 50, max_limit: 500, name: 'servicios', percentage_value: 50, color: 'bg-teal-600' },
  { expense_amount: 50, max_limit: 500, name: 'alimentos', percentage_value: 70, color: "bg-indigo-300" },
  { expense_amount: 50, max_limit: 500, name: 'despensa', percentage_value: 60, color: "bg-blue-700" },
  { expense_amount: 50, max_limit: 500, name: 'ropa', percentage_value: 30, color: 'bg-lime-100' },
  { expense_amount: 50, max_limit: 500, name: 'servicios', percentage_value: 50, color: 'bg-teal-600' },
  { expense_amount: 50, max_limit: 500, name: 'alimentos', percentage_value: 70, color: "bg-indigo-300" },
  { expense_amount: 50, max_limit: 500, name: 'despensa', percentage_value: 60, color: "bg-blue-700" },
]

const accounts = [
  { name: 'Efectivo', amount: '$500' },
  { name: 'TDC BBVA', amount: '-$600' },
  { name: 'TDD BBVA', amount: '$7,000' },
  { name: 'TDD Banamex', amount: '$1,500' },
]

export default function Tab() {

  const [toggleAddExpense, setToggleAddExpense] = useState<boolean>(false)
  const [isIncomeOpen, setIncomeOpen] = useState(false)

  return (
    <SafeAreaView style={styles.content}>
      {/* Action sheet add */}
      <AddExpense isOpen={toggleAddExpense} handleClose={setToggleAddExpense} />
      <AddIncome open={isIncomeOpen} handleClose={setIncomeOpen} />
      <View className='h-2/5'>
        <LinearGradient
          className="w-full p-2"
          colors={['#8637CF', '#0F55A1']}
          start={[0, 1]}
          end={[1, 0]}
        >
          <Heading className="text-2xl color-white">Balance</Heading>
        </LinearGradient>
        <Card size="md" variant="elevated" className="m-4">
          {accounts.map((account, i) => (
            <View key={i} className='flex flex-row gap-4'>
              <Text className='text-lg font-bold text-zinc-800'>{account.name}</Text>
              <Text className='text-lg font-semibold text-slate-800'>{account.amount}</Text>
            </View>
          ))}
        </Card>
      </View>
      <View className='h-2/5'>
        <LinearGradient
          className="w-full p-2"
          colors={['#8637CF', '#0F55A1']}
          start={[0, 1]}
          end={[1, 0]}
        >
          <Heading className="text-2xl color-white">Presupuestos</Heading>
        </LinearGradient>
        <Card size="md" variant="elevated" className="p-2 m-4">
          <ScrollView>
            {budgets.map((budged, i) => (
              <View key={i} className='my-2'>
                <View className='flex flex-row gap-4'>
                  <Heading >{budged.name}</Heading>
                  <Text>{`\$${budged.expense_amount} de \$${budged.max_limit}`}</Text>
                </View>
                <Progress id={budged.name} value={budged.percentage_value} className="w-full" size='md'>
                  <ProgressFilledTrack className={budged.color} />
                </Progress>
              </View>
            ))}
          </ScrollView>
        </Card>
      </View>
      {/* Add expense button */}
      <View style={styles.addButton} className='flex flex-row self-center gap-2'>
        <View className='w-1/2'>
          <PrimaryButton onPress={() => setIncomeOpen(true)}>
            <View className='flex flex-row items-center gap-3 px-2 text-white'>
              <Iconify icon='tabler:plus' color={'white'} /><Heading className='text-white'>Ingreso</Heading>
            </View>
          </PrimaryButton>
        </View>
        <View className='w-1/2'>
          <PrimaryButton onPress={() => setToggleAddExpense(true)} >
            <View className='flex flex-row items-center gap-3 px-2 text-white'>
              <Iconify icon='tabler:plus' color={'white'} /><Heading className='text-white'>Gasto</Heading>
            </View>
          </PrimaryButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between'
  },
  addButton: {
    justifyContent: 'flex-end',
    paddingHorizontal: '3%',
  }
});