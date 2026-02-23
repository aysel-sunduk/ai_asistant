// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
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
const GRAY = '#9BA1A6';
const GRAY_LIGHT = '#F5F5F5';
const BORDER = '#E8E8E8';

export default function RegisterScreen() {
    const router = useRouter();
    const { register, error: authError } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!firstName.trim()) e.firstName = 'Ad gereklidir';
        if (!lastName.trim()) e.lastName = 'Soyad gereklidir';
        if (!email.trim()) e.email = 'E-posta adresi gereklidir';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Geçerli bir e-posta girin';
        if (!password) e.password = 'Şifre gereklidir';
        else if (password.length < 6) e.password = 'Şifre en az 6 karakter olmalıdır';
        if (!confirmPassword) e.confirmPassword = 'Şifre tekrarı gereklidir';
        else if (password !== confirmPassword) e.confirmPassword = 'Şifreler eşleşmiyor';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const clearError = (field: string) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setIsLoading(true);
        try {
            await register({ email, firstName, lastName, password });
            Alert.alert(
                'Kayıt Başarılı',
                'Hesabınız oluşturuldu. Giriş yapabilirsiniz.',
                [{ text: 'Giriş Yap', onPress: () => router.replace('/(auth)/login') }],
            );
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Kayıt başarısız';
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
                    {/* Geri Butonu */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
                    </TouchableOpacity>

                    {/* Başlık */}
                    <View style={styles.headerSection}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="person-add" size={28} color="#fff" />
                        </View>
                        <Text style={styles.appName}>Hesap Oluştur</Text>
                        <Text style={styles.subtitle}>AsistAI'a katılın</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>
                        {/* Ad & Soyad */}
                        <View style={styles.nameRow}>
                            <View style={[styles.inputGroup, styles.nameField]}>
                                <Text style={styles.label}>Ad</Text>
                                <View style={[styles.inputWrapper, errors.firstName && styles.inputError]}>
                                    <Ionicons name="person-outline" size={18} color={errors.firstName ? '#FF6B6B' : GRAY} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Adınız"
                                        placeholderTextColor="#C4C4C4"
                                        value={firstName}
                                        onChangeText={(t) => { setFirstName(t); clearError('firstName'); }}
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                    />
                                </View>
                                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                            </View>

                            <View style={[styles.inputGroup, styles.nameField]}>
                                <Text style={styles.label}>Soyad</Text>
                                <View style={[styles.inputWrapper, errors.lastName && styles.inputError]}>
                                    <Ionicons name="person-outline" size={18} color={errors.lastName ? '#FF6B6B' : GRAY} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Soyadınız"
                                        placeholderTextColor="#C4C4C4"
                                        value={lastName}
                                        onChangeText={(t) => { setLastName(t); clearError('lastName'); }}
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                    />
                                </View>
                                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                            </View>
                        </View>

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
                                    onChangeText={(t) => { setEmail(t); clearError('email'); }}
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
                                    placeholder="En az 6 karakter"
                                    placeholderTextColor="#C4C4C4"
                                    value={password}
                                    onChangeText={(t) => { setPassword(t); clearError('password'); }}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={GRAY} />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Şifre Tekrar */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Şifre Tekrar</Text>
                            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={errors.confirmPassword ? '#FF6B6B' : GRAY} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Şifrenizi tekrar girin"
                                    placeholderTextColor="#C4C4C4"
                                    value={confirmPassword}
                                    onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
                                    secureTextEntry={!showConfirm}
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    onSubmitEditing={handleRegister}
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeButton}>
                                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={GRAY} />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                        </View>

                        {/* Kayıt Butonu */}
                        <TouchableOpacity
                            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                            activeOpacity={0.85}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                            )}
                        </TouchableOpacity>

                        {/* Ayırıcı */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>veya</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Sosyal Giriş */}
                        <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                            <Ionicons name="logo-google" size={20} color="#DB4437" />
                            <Text style={styles.socialButtonText}>Google ile kayıt ol</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                            <Ionicons name="logo-apple" size={20} color="#000" />
                            <Text style={styles.socialButtonText}>Apple ile kayıt ol</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Alt Kısım */}
                    <View style={styles.footerSection}>
                        <Text style={styles.footerText}>Zaten hesabınız var mı?</Text>
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

    /* Geri Butonu */
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
        marginBottom: 32,
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
    appName: {
        fontSize: 26,
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
    nameRow: {
        flexDirection: 'row',
        gap: 12,
    },
    nameField: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 18,
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
        paddingVertical: Platform.OS === 'ios' ? 15 : 13,
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

    /* Kayıt Butonu */
    registerButton: {
        backgroundColor: PURPLE,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    registerButtonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    /* Ayırıcı */
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
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

    /* Sosyal */
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
        marginTop: 28,
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
});