import { StyleSheet, View } from "react-native"

const ProgressBar = () => {
    return (
        <View style={styles.container}>
            <View className="w-1/2 bg-red-400"></View>
            <View className="w-1/2 bg-red-100"></View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5%'
    },
});

export default ProgressBar