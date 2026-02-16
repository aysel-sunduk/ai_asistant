import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

const PURPLE = '#6C63FF';
const PURPLE_LIGHT = '#8B83FF';
const PURPLE_DARK = '#5A52D5';
const GRAY = '#9BA1A6';
const GRAY_LIGHT = '#F5F5F5';
const BORDER = '#E8E8E8';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!email.trim()) newErrors.email = 'E-posta adresi gereklidir';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Geçerli bir e-posta girin';
        if (!password) newErrors.password = 'Şifre gereklidir';
        else if (password.length < 6) newErrors.password = 'Şifre en az 6 karakter olmalıdır';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setIsLoading(true);
        try {
            await login({ email, password });
            router.replace('/(tabs)/dashboard');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Giriş başarısız';
            Alert.alert('Hata', msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
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
                    {/* Logo & Başlık */}
                    <View style={styles.headerSection}>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="sparkles" size={32} color="#fff" />
                            </View>
                        </View>
                        <Text style={styles.appName}>AsistAI</Text>
                        <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>
                        {/* E-posta */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-posta</Text>
                            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                                <Ionicons name="mail-outline" size={20} color={errors.email ? '#FF6B6B' : GRAY} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="ornek@email.com"
                                    placeholderTextColor="#C4C4C4"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    returnKeyType="next"
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* Şifre */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Şifre</Text>
                            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                                <Ionicons name="lock-closed-outline" size={20} color={errors.password ? '#FF6B6B' : GRAY} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#C4C4C4"
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                                    }}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={GRAY} />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Şifremi Unuttum */}
                        <TouchableOpacity
                            style={styles.forgotButton}
                            onPress={() => router.push('/(auth)/forgot-password')}
                        >
                            <Text style={styles.forgotText}>Şifremi Unuttum</Text>
                        </TouchableOpacity>

                        {/* Giriş Butonu */}
                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.85}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.loginButtonText}>Giriş Yap</Text>
                            )}
                        </TouchableOpacity>

                        {/* Ayırıcı */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>veya</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Sosyal Giriş Butonları */}
                        <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                            <Ionicons name="logo-google" size={20} color="#DB4437" />
                            <Text style={styles.socialButtonText}>Google ile devam et</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                            <Ionicons name="logo-apple" size={20} color="#000" />
                            <Text style={styles.socialButtonText}>Apple ile devam et</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Alt Kısım */}
                    <View style={styles.footerSection}>
                        <Text style={styles.footerText}>Hesabınız yok mu?</Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                            <Text style={styles.registerLink}> Kayıt Ol</Text>
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
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 40,
    },

    /* Header / Logo */
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A2E',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        color: GRAY,
        marginTop: 6,
    },

    /* Form */
    formSection: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
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
    eyeButton: {
        padding: 6,
    },
    errorText: {
        fontSize: 12,
        color: '#FF6B6B',
        marginTop: 6,
        marginLeft: 4,
    },

    /* Şifremi Unuttum */
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: 24,
        marginTop: -4,
    },
    forgotText: {
        fontSize: 13,
        color: PURPLE,
        fontWeight: '600',
    },

    /* Giriş Butonu */
    loginButton: {
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
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    /* Ayırıcı */
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 28,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: BORDER,
    },
    dividerText: {
        fontSize: 13,
        color: GRAY,
        marginHorizontal: 16,
    },

    /* Sosyal Butonlar */
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: BORDER,
        borderRadius: 14,
        paddingVertical: 14,
        marginBottom: 12,
        gap: 10,
    },
    socialButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A2E',
    },

    /* Alt Kısım */
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
    registerLink: {
        fontSize: 14,
        fontWeight: '700',
        color: PURPLE,
    },
});
