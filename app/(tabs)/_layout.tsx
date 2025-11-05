import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Iconify } from 'react-native-iconify';


export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#8637CF', headerShown: false, tabBarHideOnKeyboard: true }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Iconify icon="ri:home-2-fill" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Movimientos',
          tabBarIcon: ({ color }) => <Iconify icon="tabler:transfer" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Cuentas',
          tabBarIcon: ({ color }) => <Iconify icon="tabler:building-bank" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Presupuestos',
          tabBarIcon: ({ color }) => <Iconify icon="mdi:graph-bar" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
