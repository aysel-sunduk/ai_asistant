import React from 'react';
import { Modal as RNModal, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    contentStyle?: ViewStyle;
}

export default function Modal({ visible, onClose, title, children, contentStyle }: ModalProps) {
    return (
        <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.content, contentStyle]}>
                    {title && (
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={styles.close}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {children}
                </View>
            </View>
        </RNModal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    content: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxHeight: '80%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '700', color: '#11181C' },
    close: { fontSize: 20, color: '#9BA1A6', padding: 4 },
});
