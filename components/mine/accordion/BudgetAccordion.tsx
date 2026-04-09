import { useState } from "react";
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
import { SecondaryButton } from "../buttons/SecondaryButton";
import { CancelButton } from "../buttons/CancelButton";
import { InputDateRange } from "@/components/mine/forms/InputDateRange";

interface BudgetAccordionProps {
  budget: BudgetType,
  onDelete: () => void,
  onEdit: () => void,
  onStartDateChange?: (date: Date) => void,
  onEndDateChange?: (date: Date) => void,
}

const BudgetAccordionHeader = ({ isExpanded, budget }: { isExpanded: boolean, budget: BudgetType }) => {
  return (
    <AccordionTitleText className={isExpanded ? "" : "p-1 border border-gray-300 rounded-md"}>
      {isExpanded ? (<GradientView className="p-3 rounded-md">
        <Heading className="flex-1 color-white">{budget.name}</Heading>
        <Heading className="color-white">{`${budget.percentage_value} %`}</Heading>
        <View className="ml-2">
          <Iconify icon="mdi:chevron-up" color="white" />
        </View>
      </GradientView>) : (
        <View className="flex flex-row items-center justify-between w-full p-2 bg-transparent ">
          <Heading className="flex-1 ">{budget.name}</Heading>
          <Heading className="">{`${budget.percentage_value} %`}</Heading>
          <View className="ml-2">
            <Iconify icon="mdi:chevron-down" color="black" />
          </View>
        </View>)}
    </AccordionTitleText>
  );
}

export const BudgetAccordion = ({ budget, onDelete, onEdit, onStartDateChange, onEndDateChange }: BudgetAccordionProps) => {

  const now = new Date();
  const [startDate, setStartDate] = useState<Date>(budget.start_date ?? new Date(now.getFullYear(), now.getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(budget.end_date ?? new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    onStartDateChange?.(date);
  };

  const handleEndDateChange = (date: Date) => {
    setEndDate(date);
    onEndDateChange?.(date);
  };

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
                <BudgetAccordionHeader isExpanded={isExpanded} budget={budget} />
              );
            }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent className="p-5">
          <ScrollView>
            <VStack>
              <View><Heading>Monto gastado</Heading></View>
              <View><Text>{cashFormat(budget.expense_amount)}</Text></View>
              <View><Heading>Monto máximo</Heading></View>
              <View><Text>{cashFormat(budget.max_limit)}</Text></View>
              <View><Heading>Monto restante</Heading></View>
              <View><Text>{cashFormat(budget.max_limit - budget.expense_amount)}</Text></View>
              <InputDateRange
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                label="Periodo"
              />
              <View className="mt-2">
                <SecondaryButton onPress={() => { }} >
                  <Text className="text-lg color-white">Ver detalle</Text>
                </SecondaryButton>
              </View>
              <View className="mt-2">
                <Button variant="outline" action='primary' onPress={onEdit}>
                  <Text className="text-lg ">Editar</Text>
                </Button>
              </View>
              <View className="mt-2">
                <CancelButton onPress={onDelete}>
                  <Text className="text-lg text-white">Eliminar</Text>
                </CancelButton>
              </View>
            </VStack>
          </ScrollView>
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  )
}