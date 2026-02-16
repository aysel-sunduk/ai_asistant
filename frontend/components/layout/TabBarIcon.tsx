import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface TabBarIconProps {
    name: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    size?: number;
}

export default function TabBarIcon({ name, color, size = 24 }: TabBarIconProps) {
    return <Ionicons name={name} size={size} color={color} />;
}
