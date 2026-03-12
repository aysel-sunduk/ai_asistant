import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MascotButtonProps {
    onPress: () => void;
}

const ROBOT_COLOR = '#4F46E5';
const PRIMARY = '#4F46E5';

const MESSAGES = [
    "Mülakat provasına hazır mısın?",
    "Hadi seni hayalindeki işe hazırlayalım!",
    "Bugün bir deneme yapalım mı?",
    "Kendini test etmeye ne dersin?",
];

export const MascotButton: React.FC<MascotButtonProps> = ({ onPress }) => {
    const [message, setMessage] = useState(MESSAGES[0]);
    const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 100, y: SCREEN_HEIGHT - 200 })).current;
    const scale = useRef(new Animated.Value(1)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const tooltipOpacity = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value,
                });
                Animated.spring(scale, { toValue: 1.1, useNativeDriver: false }).start();
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: () => {
                pan.flattenOffset();
                Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
            },
        })
    ).current;

    useEffect(() => {
        // Floating animation – must use useNativeDriver: false because it shares
        // the Animated.add node with pan.y which is driven by JS (PanResponder).
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: false }),
                Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
            ])
        ).start();

        // Random tooltip messages
        const interval = setInterval(() => {
            const nextMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
            setMessage(nextMsg);

            Animated.sequence([
                Animated.timing(tooltipOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),
                Animated.timing(tooltipOpacity, { toValue: 1, duration: 3000, useNativeDriver: false }),
                Animated.timing(tooltipOpacity, { toValue: 0, duration: 500, useNativeDriver: false }),
            ]).start();
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.container,
                {
                    transform: [
                        { translateX: pan.x },
                        { translateY: Animated.add(pan.y, floatAnim) },
                        { scale: scale },
                    ],
                },
            ]}
        >
            <Animated.View style={[styles.tooltip, { opacity: tooltipOpacity }]}>
                <Text style={styles.tooltipText}>{message}</Text>
                <View style={styles.tooltipArrow} />
            </Animated.View>

            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={styles.button}
            >
                <Image
                    source={require('../../assets/images/ai-mascot.png')}
                    style={styles.mascotImage}
                    resizeMode="contain"
                />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 9999,
        alignItems: 'center',
    },
    button: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        borderWidth: 2,
        borderColor: '#EEF2FF',
        overflow: 'hidden',
    },
    mascotImage: {
        width: '100%',
        height: '100%',
    },
    tooltip: {
        position: 'absolute',
        bottom: 85,
        backgroundColor: '#1E293B',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        width: 160,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        alignItems: 'center',
    },
    tooltipText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 18,
    },
    tooltipArrow: {
        position: 'absolute',
        bottom: -6,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#1E293B',
    },
});
