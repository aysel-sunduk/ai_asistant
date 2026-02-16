import { StyleSheet, Text, View } from 'react-native';

export default function FinanceTabScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Finans</Text>
            {/* TODO: Hesap özeti, son işlemler, yatırım portföyü */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
});
