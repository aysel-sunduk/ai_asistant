// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
}

interface Props {
    messages: Message[];
    onSend: (message: string) => void;
    isLoading?: boolean;
}

export default function AIChat({ messages, onSend, isLoading }: Props) {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (text.trim()) {
            onSend(text.trim());
            setText('');
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                        <Text style={[styles.text, item.role === 'user' ? styles.userText : styles.aiText]}>{item.content}</Text>
                    </View>
                )}
                contentContainerStyle={styles.list}
                inverted={false}
            />
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="Mesajınızı yazın..."
                    placeholderTextColor="#9BA1A6"
                    editable={!isLoading}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={isLoading}>
                    <Text style={styles.sendText}>Gönder</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 16 },
    bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
    userBubble: { backgroundColor: '#6C63FF', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: '#F0F0F0', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
    text: { fontSize: 14, lineHeight: 20 },
    userText: { color: '#fff' },
    aiText: { color: '#11181C' },
    inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#fff' },
    input: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, marginRight: 8, color: '#11181C' },
    sendBtn: { backgroundColor: '#6C63FF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24 },
    sendText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});