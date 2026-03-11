import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AICoachCardProps {
    onPress: () => void;
}

const PRIMARY = '#4F46E5';

export const AICoachCard: React.FC<AICoachCardProps> = ({ onPress }) => {
    return (
        <TouchableOpacity 
            style={styles.card} 
            onPress={onPress} 
            activeOpacity={0.9}
        >
            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <View style={styles.badge}>
                        <Ionicons name="sparkles" size={12} color="#fff" />
                        <Text style={styles.badgeText}>AI DESTEKLİ</Text>
                    </View>
                    <Text style={styles.title}>Mülakat Koçu</Text>
                    <Text style={styles.description}>
                        Kariyer hedeflerin için profesyonel mülakat provasına ne dersin?
                    </Text>
                    <View style={styles.button}>
                        <Text style={styles.buttonText}>Hemen Başlat</Text>
                        <Ionicons name="arrow-forward" size={16} color={PRIMARY} />
                    </View>
                </View>
                
                <View style={styles.imageContainer}>
                    <Image 
                        source={require('../../assets/images/ai-mascot.png')}
                        style={styles.mascotImage}
                        resizeMode="contain"
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: PRIMARY,
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
        marginRight: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
        gap: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    title: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 6,
    },
    description: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 8,
    },
    buttonText: {
        color: PRIMARY,
        fontSize: 14,
        fontWeight: '800',
    },
    imageContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mascotImage: {
        width: 110,
        height: 110,
    },
});
