// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';
const GRAY_LIGHT = '#F5F5F5';
const BORDER = '#E8E8E8';

export default function ForgotPasswordScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');

    const validate = () => {
        if (!email.trim()) { setError('E-posta adresi gereklidir'); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Geçerli bir e-posta girin'); return false; }
        setError('');
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsLoading(true);
        try {
            await forgotPassword(email);
            setIsSent(true);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Geri Butonu */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
                    </TouchableOpacity>

                    {/* Başlık */}
                    <View style={styles.headerSection}>
                        <View style={styles.logoCircle}>
                            <Ionicons name={isSent ? 'checkmark-done' : 'key'} size={28} color="#fff" />
                        </View>
                        <Text style={[styles.title, isDark && styles.textDark]}>
                            {isSent ? 'E-posta Gönderildi!' : 'Şifremi Unuttum'}
                        </Text>
                        <Text style={[styles.subtitle, isDark && styles.subTextDark]}>
                            {isSent
                                ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.'
                                : 'Hesabınıza bağlı e-posta adresini girin, size şifre sıfırlama bağlantısı gönderelim.'}
                        </Text>
                    </View>

                    {isSent ? (
                        /* Başarılı Durum */
                        <View style={styles.formSection}>
                            <View style={styles.sentInfo}>
                                <Ionicons name="mail-open-outline" size={48} color={PURPLE} />
                                <Text style={styles.sentEmail}>{email}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => router.back()}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.primaryButtonText}>Giriş Sayfasına Dön</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.resendButton}
                                onPress={() => { setIsSent(false); }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.resendText}>Tekrar Gönder</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Form */
                        <View style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, isDark && styles.subTextDark]}>E-posta</Text>
                                <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
                                    <Ionicons name="mail-outline" size={20} color={error ? '#FF6B6B' : GRAY} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, isDark && styles.inputDark]}
                                        placeholder="ornek@email.com"
                                        placeholderTextColor="#C4C4C4"
                                        value={email}
                                        onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoFocus
                                        returnKeyType="done"
                                        onSubmitEditing={handleSubmit}
                                    />
                                </View>
                                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                                activeOpacity={0.85}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Sıfırlama Bağlantısı Gönder</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Alt Kısım */}
                    <View style={styles.footerSection}>
                        <Text style={styles.footerText}>Şifrenizi hatırladınız mı?</Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.loginLink}> Giriş Yap</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
    },

    /* Geri */
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: GRAY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },

    /* Başlık */
    headerSection: {
        alignItems: 'center',
        marginBottom: 36,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A1A2E',
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: GRAY,
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 8,
    },

    /* Form */
    formSection: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A2E',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: GRAY_LIGHT,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'transparent',
        paddingHorizontal: 14,
    },
    inputError: {
        borderColor: '#FF6B6B',
        backgroundColor: '#FFF5F5',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A2E',
        paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    },
    errorText: {
        fontSize: 12,
        color: '#FF6B6B',
        marginTop: 6,
        marginLeft: 4,
    },

    /* Butonlar */
    primaryButton: {
        backgroundColor: PURPLE,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    primaryButtonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    /* Gönderildi Durumu */
    sentInfo: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    sentEmail: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A2E',
    },
    resendButton: {
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 12,
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
        color: PURPLE,
    },

    /* Alt */
    footerSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 14,
        color: GRAY,
    },
    loginLink: {
        fontSize: 14,
        fontWeight: '700',
        color: PURPLE,
    },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});