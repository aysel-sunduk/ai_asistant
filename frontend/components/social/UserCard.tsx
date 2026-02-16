import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../ui/Avatar';
import Card from '../ui/Card';

interface Props { name: string; username: string; avatarUrl?: string; onPress?: () => void; }

export default function UserCard({ name, username, avatarUrl, onPress }: Props) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card>
                <View style={styles.row}>
                    <Avatar uri={avatarUrl} name={name} size={44} />
                    <View style={styles.info}>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={styles.username}>@{username}</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: '#11181C' },
    username: { fontSize: 13, color: '#9BA1A6', marginTop: 2 },
});
