import { StyleSheet, Text, View } from 'react-native';

export default function BlogTabScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Blog</Text>
            {/* TODO: Blog akışı, yazı listesi */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
});
