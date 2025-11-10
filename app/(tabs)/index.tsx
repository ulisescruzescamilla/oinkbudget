import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { View, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetType } from '@/types/BudgetType';
import { useCallback, useState } from 'react';
import AddExpense from '@/components/mine/actions/AddExpense';
import { GradientView, PrimaryButton } from '@/components/mine';
import Iconify from 'react-native-iconify';
import AddIncome from '@/components/mine/actions/AddIncome';
import { useFocusEffect } from 'expo-router';
import { getAllBudgets } from '@/database/budgetRepository';
import { AccountType } from '@/types/AccountType';
import { getAllAccounts } from '@/database/accountRepository';
import { cashFormat } from '@/utils/formatting';

export default function Tab() {

  const [toggleAddExpense, setToggleAddExpense] = useState<boolean>(false)
  const [isIncomeOpen, setIncomeOpen] = useState(false)

  const [budgets, setBudgets] = useState<BudgetType[]>([])
  const [accounts, setAccounts] = useState<AccountType[]>([])

  useFocusEffect(
    useCallback(() => {
      getAllBudgets().then((data) => {
        setBudgets(data)
      })

      getAllAccounts().then((data) => {
        setAccounts(data)
      })

      return () => {
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.content}>
      {/* Action sheet add */}
      <AddExpense isOpen={toggleAddExpense} handleClose={setToggleAddExpense} />
      <AddIncome open={isIncomeOpen} handleClose={setIncomeOpen} />
      <View className='h-2/5'>
        <GradientView>
          <Heading className="text-2xl color-white">Balance</Heading>
        </GradientView>
        <Card size="md" variant="elevated" className="m-4">
          {accounts.map((account, i) => (
            !account.hidden && (
              <View key={i} className='flex flex-row gap-4'>
                <Text className='text-lg font-bold text-zinc-800'>{account.name}</Text>
                <Text className='text-lg font-semibold text-slate-800'>{cashFormat(account.amount)}</Text>
              </View>
            )
          ))}
        </Card>
      </View>
      <View className='h-2/5'>
        <GradientView>
          <Heading className="text-2xl color-white">Presupuestos</Heading>
        </GradientView>
        <Card size="md" variant="elevated" className="p-2 m-4">
          <ScrollView>
            {budgets.map((budged, i) => (
              <View key={i} className='my-2'>
                <View className='flex flex-row gap-4'>
                  <Heading >{budged.name}</Heading>
                  <Text>{`\$${budged.expense_amount} de \$${budged.max_limit}`}</Text>
                </View>
                <Progress id={budged.name} value={budged.expense_amount * 100 / budged.max_limit} className="w-full" size='md'>
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