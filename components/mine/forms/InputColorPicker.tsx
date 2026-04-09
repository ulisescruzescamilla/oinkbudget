import { FlatList, Pressable, View } from "react-native";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { LinearGradient } from "@/components/ui/linear-gradient";

/** Budget-friendly palette derived from the app's primary/secondary brand colors. */
const COLORS: string[] = [
  "#8637CF", // violet — primary brand
  "#0F55A1", // navy blue — secondary brand
  "#6366F1", // indigo
  "#06B6D4", // cyan
  "#14B8A6", // teal
  "#22C55E", // green
  "#F59E0B", // amber
  "#F97316", // orange
  "#EF4444", // red
  "#EC4899", // pink
];

interface InputColorPickerProps {
  /** Currently selected hex color. */
  value: string;
  /** Called when the user picks a new color. */
  onChange: (color: string) => void;
  /** Form field label shown above the carousel. */
  label?: string;
}

/**
 * A horizontal carousel of color swatches for picking a budget color.
 * Each swatch is a filled circle; the selected one receives a matching
 * outer ring border to indicate focus.
 */
export const InputColorPicker = ({
  value,
  onChange,
  label = "Color",
}: InputColorPickerProps) => {
  return (
    <FormControl size="md">
      <FormControlLabel>
        <FormControlLabelText>{label}</FormControlLabelText>
      </FormControlLabel>

      <View style={{ position: "relative" }}>
        <FlatList
          data={COLORS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(color) => color}
          contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
          renderItem={({ item: color }) => {
            const isSelected = color === value;
            return (
              <Pressable
                onPress={() => onChange(color)}
                hitSlop={6}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={color}
              >
                {/* Outer ring — only visible when selected */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: isSelected ? color : "transparent",
                    padding: 3,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {/* Filled swatch */}
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: color,
                    }}
                  />
                </View>
              </Pressable>
            );
          }}
        />
        {/* Fade hint indicating more items to the right */}
        <LinearGradient
          colors={["transparent", "white"]}
          start={[0, 0]}
          end={[1, 0]}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 40,
            pointerEvents: "none",
          }}
        />
      </View>
    </FormControl>
  );
};
