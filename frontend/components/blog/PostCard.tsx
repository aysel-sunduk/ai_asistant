import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BlogPost } from '../../src/models/blog.model';
import { formatRelativeTime } from '../../src/utils/format';
import Card from '../ui/Card';

interface Props { post: BlogPost; onPress?: () => void; }

export default function PostCard({ post, onPress }: Props) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card>
                <Text style={styles.title}>{post.title}</Text>
                {post.summary && <Text style={styles.summary} numberOfLines={2}>{post.summary}</Text>}
                <View style={styles.footer}>
                    <Text style={styles.meta}>{formatRelativeTime(post.createdAt)}</Text>
                    <View style={styles.stats}>
                        <Text style={styles.stat}>❤️ {post.likeCount}</Text>
                        <Text style={styles.stat}>💬 {post.commentCount}</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 18, fontWeight: '700', color: '#11181C' },
    summary: { fontSize: 14, color: '#687076', marginTop: 6 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    meta: { fontSize: 12, color: '#9BA1A6' },
    stats: { flexDirection: 'row', gap: 12 },
    stat: { fontSize: 13, color: '#687076' },
});
