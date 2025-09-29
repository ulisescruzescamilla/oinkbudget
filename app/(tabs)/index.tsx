import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { VStack } from '@/components/ui/vstack';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';

const budgets = [
    { name: 'ropa', value: 30, color: 'bg-emerald-600' },
    { name: 'servicios', value: 50, color: 'bg-teal-600' },
    { name: 'alimentos', value: 70, color: "bg-indigo-300" },
    { name: 'despensa', value: 60, color: "bg-blue-700" },
    { name: 'ropa', value: 30, color: 'bg-lime-100' },
    { name: 'servicios', value: 50, color: 'bg-teal-600' },
    { name: 'alimentos', value: 70, color: "bg-indigo-300" },
    { name: 'despensa', value: 60, color: "bg-blue-700" },
]

const accounts = [
    { name: 'Efectivo', amount: '$500' },
    { name: 'TDC BBVA', amount: '-$600' },
    { name: 'TDD BBVA', amount: '$7,000' },
    { name: 'TDD Banamex', amount: '$1,500' },
]

export default function Tab() {
    return (
        <SafeAreaProvider>
            <VStack space="md" className="w-full pt-4 bg-white-50">
                <View className='h-2/5'>
                    <LinearGradient
                        className="w-full p-2"
                        colors={['#8637CF', '#0F55A1']}
                        start={[0, 1]}
                        end={[1, 0]}
                    >
                        <Heading className="text-2xl color-white">Balance</Heading>
                    </LinearGradient>
                    <Card size="lg" variant="elevated" className="m-4">
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
                    <Card size="lg" variant="elevated" className="m-4">
                        <ScrollView style={{ width: '100%' }}>
                            <VStack space="3xl" className="w-full mt-2">
                                {budgets.map((budged, i) => (
                                    <View key={i}>
                                        <Heading >{budged.name}</Heading>
                                        <Progress id={budged.name} value={budged.value} className="w-full" size='md'>
                                            <ProgressFilledTrack className={budged.color} />
                                        </Progress>
                                    </View>
                                ))}
                            </VStack>
                        </ScrollView>
                    </Card>
                </View>
                {/* Add expense button */}
                <View className='m-2 mt-3 h-1/5'>
                    <LinearGradient
                        className="items-center w-full p-3 rounded-full"
                        colors={['#8637CF', '#0F55A1']}
                        start={[0, 1]}
                        end={[1, 0]}
                    >
                        <Text className="text-2xl text-white">Agregar gasto</Text>
                    </LinearGradient>
                </View>
            </VStack>
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