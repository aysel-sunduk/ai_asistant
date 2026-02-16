import { StyleSheet, Text, View } from 'react-native';
export default function SudokuScreen() {
    return (<View style={styles.container}><Text style={styles.title}>Sudoku</Text></View>);
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' }, title: { fontSize: 24, fontWeight: 'bold' } });
