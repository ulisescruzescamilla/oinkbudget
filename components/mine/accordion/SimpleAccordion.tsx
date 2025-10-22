import { Text, View } from "@/components/Themed";
import { Accordion, AccordionContent, AccordionContentText, AccordionHeader, AccordionIcon, AccordionItem, AccordionTitleText, AccordionTrigger } from "@/components/ui/accordion";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui/icon";
import { LinearGradient } from "@/components/ui/linear-gradient";
import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";
import type { BudgetType } from "@/types/BudgetType";
import { cashFormat } from "@/utils/formatting";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { SwipeableRow } from "../swipeable";
import Iconify from "react-native-iconify";
import { TouchableOpacity } from "react-native";

interface SimpleAccordionProps {
  title: string,
  children?: React.ReactNode,
  fetchData: () => Promise<BudgetType[]>,
  setItem: (item: any) => void,
  toogleItem: (toggle: boolean) => void,
}

export const SimpleAccordion = ({ title, children, fetchData, setItem, toogleItem }: SimpleAccordionProps) => {

  const [data, setData] = useState<BudgetType[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    setLoading(true)
    fetchData()
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (data.length === 0) {
    return <></>
  }

  return (
    <Accordion
      size="md"
      variant="filled"
      type="single"
      isCollapsible={true}
      isDisabled={false}
    >
      <AccordionItem value="a">
        <AccordionHeader>
          <AccordionTrigger>
            {({ isExpanded }) => {
              return (
                <>
                  <AccordionTitleText>
                    {title}
                  </AccordionTitleText>
                  {isExpanded ? (
                    <AccordionIcon as={ChevronUpIcon} className="ml-3" />
                  ) : (
                    <AccordionIcon as={ChevronDownIcon} className="ml-3" />
                  )}
                </>
              );
            }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent>
          <ScrollView>
            {loading && <Spinner />}
            {data.map((budget) => (
              <VStack key={budget.id}>
                <SwipeableRow options={
                  <View className="flex flex-row gap-2 bg-transparent">
                    <TouchableOpacity onPress={() => { setItem(budget) }}>
                      <Iconify icon='fe:pencil' width={32} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setItem(budget); toogleItem(true) }}>
                      <Iconify icon='tabler:trash' width={32} />
                    </TouchableOpacity>
                  </View>
                }
                >
                  <LinearGradient
                    className="flex flex-row items-center w-full p-2"
                    colors={['#8637CF', '#0F55A1']}
                    start={[0, 1]}
                    end={[1, 0]}
                  >
                    <Heading className="flex-1 text-xl color-white">{budget.name}</Heading>
                    <Heading className="mr-3 text-lg color-white">{`${budget.percentage_value} %`}</Heading>
                    <Iconify icon='tabler:grip-vertical' color={'white'} size={20} />
                  </LinearGradient>
                </SwipeableRow>
                <View><Heading>Monto gastado</Heading></View>
                <View><Text>{cashFormat(budget.expense_amount)}</Text></View>
                <View><Heading>Monto máximo</Heading></View>
                <View><Text>{cashFormat(budget.max_limit)}</Text></View>
                <View><Heading>Monto restante</Heading></View>
                <View><Text>{cashFormat(budget.max_limit - budget.expense_amount)}</Text></View>
              </VStack>
            ))}
          </ScrollView>
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  )
}