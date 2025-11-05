import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTitleText, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollView } from "react-native-gesture-handler";
import { View } from "react-native";
import Iconify from "react-native-iconify";
import { GradientView } from "../view/GradientView";

interface ThemedAccordionProps {
  header: (isExpanded: boolean) => React.ReactNode,
  content: React.ReactNode,
}

const ThemedAccordionHeader = ({ isExpanded, header }: { isExpanded: boolean, header: (isExpanded: boolean) => React.ReactNode }) => {
  return (
    <AccordionTitleText className={isExpanded ? "" : "p-1 border border-gray-300 rounded-md"}>
      {isExpanded ? (<GradientView className="p-3 rounded-md">
        <View className="flex-1 color-white">{header(isExpanded)}</View>
        <View className="ml-2">
          <Iconify icon="mdi:chevron-up" color="white" />
        </View>
      </GradientView>) : (
        <View className="flex flex-row items-center justify-between w-full p-2 bg-transparent ">
          <View>{header(isExpanded)}</View>
          <View className="ml-2">
            <Iconify icon="mdi:chevron-down" color="black" />
          </View>
        </View>)}
    </AccordionTitleText>
  );
}

export const ThemedAccordion = ({ header, content }: ThemedAccordionProps) => {
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
                <ThemedAccordionHeader isExpanded={isExpanded} header={header} />
              );
            }}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent className="p-5">
          {content}
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  )
}