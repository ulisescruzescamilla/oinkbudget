import { ReactNode } from "react"
import { View } from "react-native"

interface CardProps {
    children: ReactNode
}

export const Card = ({ children }: CardProps) => {
    return (
        <View className='w-full m-4 border rounded-md border-gray-50 shadow-slate-200'>
            {children}
        </View>
    )
}