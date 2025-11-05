import { Heading } from "@/components/ui/heading";
import { cashFormat } from "@/utils/formatting";
import { useEffect, useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Iconify from "react-native-iconify";

interface ColorAccordionProps {
  heading: string;
  fetchData: (date: string) => Promise<any[] | undefined>;
}

export const ColorAccordion = ({ heading, fetchData }: ColorAccordionProps) => {
  const [toggle, setToggle] = useState(heading === 'HOY' ? true : false);
  const [data, setData] = useState<any[] | undefined>([])

  useEffect(() => {
    fetchData(heading).then(rows => {
      setData(rows)
    })
  }, [toggle])

  return (
    <View>
      <TouchableOpacity onPress={() => setToggle(!toggle)}>
        <View className="bg-[#8637CF] border border-gray-100 rounded-md p-3 flex flex-row justify-between">
          <Heading className="color-white">{heading}</Heading>
          {toggle ? (
            <Iconify icon="mdi:chevron-up" color="white" width={24} height={24} />
          ) : (
            <Iconify icon="mdi:chevron-down" color="white" width={24} height={24} />
          )}
        </View>
      </TouchableOpacity>
      {toggle && (
        <ScrollView >
          <View className="flex flex-row p-2">
            <Text className="flex-1 font-bold">Monto</Text>
            <Text className="flex-1 font-bold">Cuenta</Text>
            <Text className="flex-1 font-bold">Descripción</Text>
            <Text className="font-bold flex-4">I/O</Text>
          </View>
          {data?.map((data, index) => (
            <View className="flex flex-row p-2" key={index}>
              <Text className="flex-1">{cashFormat(data.amount)}</Text>
              <Text className="flex-1">{data.description}</Text>
              <Text className="flex-1">{data.account_name}</Text>
              <View className="flex-4">
                {data.type === 'income' ? (
                  <Iconify icon="raphael:arrowup" color="green" />
                ) : (
                  <Iconify icon="raphael:arrowdown" color="red" />
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}