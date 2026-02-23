// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface Props { isFollowing: boolean; onPress: () => void; }

export default function FollowButton({ isFollowing, onPress }: Props) {
    return (
        <TouchableOpacity
            style={[styles.button, isFollowing ? styles.following : styles.notFollowing]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[styles.text, isFollowing ? styles.followingText : styles.notFollowingText]}>
                {isFollowing ? 'Takipte' : 'Takip Et'}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
    following: { backgroundColor: '#F0F0F0' },
    notFollowing: { backgroundColor: '#6C63FF' },
    text: { fontSize: 14, fontWeight: '600' },
    followingText: { color: '#11181C' },
    notFollowingText: { color: '#fff' },
});