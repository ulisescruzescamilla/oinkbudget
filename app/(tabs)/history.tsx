import { View } from "@/components/Themed"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { LinearGradient } from "@/components/ui/linear-gradient"
import { Text } from "@/components/ui/text"
import { SafeAreaView } from "react-native-safe-area-context"

const Tab = () => {
  return (
    <SafeAreaView style={styles.content}>
      {/* Content */}
      <LinearGradient
        className="w-full p-2"
        colors={['#8637CF', '#0F55A1']}
        start={[0, 1]}
        end={[1, 0]}
      >
        <Heading className="text-2xl color-white">Movimientos</Heading>
      </LinearGradient>
      <Card size="md" variant="elevated" className="p-2 m-4">
        { }
      </Card>
    </SafeAreaView>
  )
}

const styles = {
  content: {
    flex: 1,
  },
}

export default Tab