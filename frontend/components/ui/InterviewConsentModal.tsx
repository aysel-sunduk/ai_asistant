import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InterviewConsentModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const InterviewConsentModal: React.FC<InterviewConsentModalProps> = ({
    visible,
    onClose,
    onConfirm,
}) => {
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const [soundChecked, setSoundChecked] = useState(false);

    const isReady = kvkkAccepted && soundChecked;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="shield-checkmark" size={24} color="#6C63FF" />
                        </View>
                        <Text style={styles.title}>Önemli Bilgilendirme</Text>
                    </View>

                    <ScrollView style={styles.scroll}>
                        <Text style={styles.sectionTitle}>1. KVKK ve Veri İşleme</Text>
                        <Text style={styles.text}>
                            Mülakat provası sırasında verdiğiniz sesli ve yazılı cevaplar, yapay zeka tarafından analiz edilmek üzere işlenecektir. Verileriniz KVKK kapsamında korunmakta olup sadece size özel geri bildirimler oluşturmak için kullanılır.
                        </Text>

                        <Text style={styles.sectionTitle}>2. Teknik Hazırlık</Text>
                        <Text style={styles.text}>
                            Sağlıklı bir mülakat deneyimi için lütfen sessiz bir ortamda olduğunuzdan ve cihazınızın sesinin açık olduğundan emin olun. Sesli cevaplar sırasında mikrofon erişim izni gerekecektir.
                        </Text>
                    </ScrollView>

                    <View style={styles.switches}>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>KVKK metnini okudum, onaylıyorum.</Text>
                            <Switch
                                value={kvkkAccepted}
                                onValueChange={setKvkkAccepted}
                                trackColor={{ false: '#E2E8F0', true: '#6C63FF' }}
                            />
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Cihazımın sesinin açık olduğunu teyit ederim.</Text>
                            <Switch
                                value={soundChecked}
                                onValueChange={setSoundChecked}
                                trackColor={{ false: '#E2E8F0', true: '#6C63FF' }}
                            />
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>Vazgeç</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, !isReady && styles.disabledBtn]}
                            onPress={onConfirm}
                            disabled={!isReady}
                        >
                            <Text style={styles.confirmBtnText}>Devam Et</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxHeight: '80%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#6C63FF15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A2E',
    },
    scroll: {
        maxHeight: 250,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A2E',
        marginTop: 12,
        marginBottom: 6,
    },
    text: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    switches: {
        gap: 12,
        marginBottom: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    switchLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    confirmBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#6C63FF',
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    disabledBtn: {
        opacity: 0.5,
    },
});
