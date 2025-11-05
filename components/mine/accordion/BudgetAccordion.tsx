import { Text, View } from "react-native";
import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTitleText, AccordionTrigger } from "@/components/ui/accordion";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import type { BudgetType } from "@/types/BudgetType";
import { cashFormat } from "@/utils/formatting";
import { ScrollView } from "react-native-gesture-handler";
import Iconify from "react-native-iconify";
import { GradientView } from "../view/GradientView";
import { Button } from "@/components/ui/button";

interface BudgetAccordionProps {
  budget: BudgetType,
  setItem: (item: any) => void,
  toogleItem: (toggle: boolean) => void,
}

export const BudgetAccordion = ({ budget, setItem, toogleItem }: BudgetAccordionProps) => {

  if (!budget) {
    return (
      <View className="flex flex-row justify-center">
        <Text>No hay datos disponibles</Text>
      </View>
    )
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
            {({ isExpanded }: { isExpanded: boolean }) => {
              return (
                <AccordionTitleText>
                  <GradientView className="w-full rounded-md">
                    <Heading className="flex-1 color-white">{budget.name}</Heading>
                    <Heading className="color-white">{`${budget.percentage_value} %`}</Heading>
                    <View className="ml-2">
                      <Iconify icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} color="white" />
                    </View>
                  </GradientView>
                </AccordionTitleText>
              );
            }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent>
          <ScrollView>
            <VStack>
              <View><Heading>Monto gastado</Heading></View>
              <View><Text>{cashFormat(budget.expense_amount)}</Text></View>
              <View><Heading>Monto máximo</Heading></View>
              <View><Text>{cashFormat(budget.max_limit)}</Text></View>
              <View><Heading>Monto restante</Heading></View>
              <View><Text>{cashFormat(budget.max_limit - budget.expense_amount)}</Text></View>
              <View className="mt-2">
                <Button className="bg-[#0F55A1]" onPress={() => { }}><Text className="text-lg color-white">Ver detalle</Text></Button>
              </View>
            </VStack>
          </ScrollView>
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  )
}