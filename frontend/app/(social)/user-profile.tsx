import { StyleSheet, Text, View } from 'react-native';
export default function UserProfileScreen() {
    return (<View style={styles.container}><Text style={styles.title}>Kullanıcı Profili</Text></View>);
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' }, title: { fontSize: 24, fontWeight: 'bold' } });
