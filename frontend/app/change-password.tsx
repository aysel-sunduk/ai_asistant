import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { authService } from '../services/auth.service';

const PURPLE = '#6C63FF';
const BORDER = '#E2E8F0';
const TEXT_MAIN = '#1E293B';
const TEXT_MUTED = '#64748B';

export default function ChangePasswordScreen() {
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Göz ikonları için state
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Hata', 'Yeni şifreniz en az 6 karakter olmalıdır.');
            return;
        }

        setIsLoading(true);
        try {
            await authService.changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });
            Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi.', [
                { text: 'Tamam', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Şifre değiştirilemedi. Lütfen mevcut şifrenizi kontrol edin.';
            Alert.alert('Hata', msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={TEXT_MAIN} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Şifre Değiştir</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="lock-closed" size={48} color={PURPLE} />
                    </View>
                    <Text style={styles.description}>
                        Hesabınızın güvenliği için güçlü ve benzersiz bir şifre kullanmanızı öneririz.
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    {/* Mevcut Şifre */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mevcut Şifre</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="key-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mevcut şifrenizi girin"
                                secureTextEntry={!showCurrent}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                                <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color={TEXT_MUTED} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Yeni Şifre */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Yeni Şifre</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Yeni şifre belirleyin"
                                secureTextEntry={!showNew}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                                <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color={TEXT_MUTED} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Yeni Şifre Tekrar */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="checkmark-circle-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Yeni şifrenizi doğrulayın"
                                secureTextEntry={!showConfirm}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={TEXT_MUTED} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Sabit Buton Alanı */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleChangePassword}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Şifreyi Güncelle</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TEXT_MAIN,
    },
    scrollContent: {
        padding: 24,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        color: TEXT_MUTED,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: TEXT_MAIN,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 14,
        height: 52,
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: TEXT_MAIN,
        height: '100%',
    },
    eyeBtn: {
        padding: 8,
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    saveButton: {
        backgroundColor: PURPLE,
        borderCurve: 'continuous',
        borderRadius: 16,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
