// Kisa aciklama: Bu dosya modulin destek kodunu icerir.
/**
 * İkon sabitleri – Tab bar ve navigasyon ikonları
 * @expo/vector-icons (Ionicons) isimleri
 */
export const Icons = {
    // Tab bar
    dashboard: 'home-outline' as const,
    dashboardActive: 'home' as const,
    finance: 'wallet-outline' as const,
    financeActive: 'wallet' as const,
    health: 'heart-outline' as const,
    healthActive: 'heart' as const,
    blog: 'book-outline' as const,
    blogActive: 'book' as const,
    profile: 'person-outline' as const,
    profileActive: 'person' as const,

    // Genel
    back: 'arrow-back' as const,
    close: 'close' as const,
    search: 'search' as const,
    add: 'add' as const,
    edit: 'create-outline' as const,
    delete: 'trash-outline' as const,
    settings: 'settings-outline' as const,
    notifications: 'notifications-outline' as const,
    calendar: 'calendar-outline' as const,
    time: 'time-outline' as const,
    location: 'location-outline' as const,
    mail: 'mail-outline' as const,
    star: 'star-outline' as const,
    checkmark: 'checkmark-circle-outline' as const,

    // Modüller
    work: 'briefcase-outline' as const,
    reminders: 'alarm-outline' as const,
    contacts: 'people-outline' as const,
    goals: 'flag-outline' as const,
    shopping: 'cart-outline' as const,
    games: 'game-controller-outline' as const,
    ai: 'sparkles-outline' as const,
    social: 'globe-outline' as const,
    family: 'people-circle-outline' as const,

    // Finans
    income: 'trending-up' as const,
    expense: 'trending-down' as const,
    investment: 'stats-chart' as const,
    exchange: 'swap-horizontal' as const,

    // Sağlık
    water: 'water' as const,
    exercise: 'barbell-outline' as const,
    meal: 'restaurant-outline' as const,
    sleep: 'moon-outline' as const,
};