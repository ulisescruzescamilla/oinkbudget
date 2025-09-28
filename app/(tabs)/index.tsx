import { Center } from '@/components/ui/center';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { VStack } from '@/components/ui/vstack';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const budgets = [
    { name: 'ropa', value: 30, color: 'bg-emerald-600' },
    { name: 'servicios', value: 50, color: 'bg-teal-600' },
    { name: 'alimentos', value: 70, color: "bg-indigo-300" },
    { name: 'despensa', value: 60, color: "bg-blue-700" },
    { name: 'ropa', value: 30, color: 'bg-emerald-600' },
    { name: 'servicios', value: 50, color: 'bg-teal-600' },
    { name: 'alimentos', value: 70, color: "bg-indigo-300" },
    { name: 'despensa', value: 60, color: "bg-blue-700" },
]

const accounts = [
    { name: 'efectivo', amount: '$500' },
    { name: 'TDC BBVA', amount: '-$600' },
    { name: 'TDD BBVA', amount: '$7,000' },
    { name: 'TDD Banamex', amount: '$1,500' },
]

export default function Tab() {
    return (
        <SafeAreaProvider>
            <VStack space="md" className="w-full p-3 pt-4 h-5/6 bg-gray-50">
                <View className='h-1/2'>
                    <SafeAreaView edges={['top']}>
                        <Heading className="text-3xl font-bold">Balance</Heading>
                        <ScrollView style={{ width: '100%' }}>
                            <VStack space="3xl" className="w-full h-full mt-6">
                                {accounts.map((account, i) => (
                                    <View key={i} className='flex flex-row gap-4'>
                                        <Text className='text-lg font-bold text-zinc-800'>{account.name}</Text>
                                        <Text className='text-lg font-semibold text-slate-800'>{account.amount}</Text>
                                    </View>
                                ))}
                            </VStack>
                        </ScrollView>
                    </SafeAreaView>
                </View>
                <View className='h-1/2'>
                    <Heading className="mb-4 text-3xl font-bold">Presupuestos</Heading>
                    <ScrollView style={{ width: '100%' }}>
                        <VStack space="3xl" className="w-full mt-1">
                            {budgets.map((budged, i) => (
                                <View key={i}>
                                    <Text className='text-lg font-semibold'>{budged.name}</Text>
                                    <Progress id={budged.name} value={budged.value} className="w-full" size='lg'>
                                        <ProgressFilledTrack className={budged.color} />
                                    </Progress>
                                </View>
                            ))}
                        </VStack>
                    </ScrollView>
                </View>
            </VStack>
            {/* Add expense button */}
            <View className='w-full p-4 mt-4'>
                <LinearGradient
                    className="items-center w-full p-3 rounded-full"
                    colors={['#8637CF', '#0F55A1']}
                    start={[0, 1]}
                    end={[1, 0]}
                >
                    <Text className="font-semibold text-gray-300">Agregar gasto</Text>
                </LinearGradient>
            </View>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    containerBudgets: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        padding: '5%',
    },
    containerAccounts: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        padding: '5%',
    },
});