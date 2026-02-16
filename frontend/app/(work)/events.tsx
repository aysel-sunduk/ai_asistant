import { StyleSheet, Text, View } from 'react-native';

export default function EventsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Toplantılar</Text>
            {/* TODO: Toplantı listesi */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
});
