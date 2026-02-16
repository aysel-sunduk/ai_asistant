import { StyleSheet, Text, View } from 'react-native';
export default function ShoppingListsScreen() {
    return (<View style={styles.container}><Text style={styles.title}>Alışveriş Listeleri</Text></View>);
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' }, title: { fontSize: 24, fontWeight: 'bold' } });
