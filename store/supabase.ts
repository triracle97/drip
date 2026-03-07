import { createClient } from '@supabase/supabase-js';

// TODO: Move to env vars for production
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface PopularSub {
    id: string;
    name: string;
    icon: string;
    default_cost: number;
    default_cycle: string;
    category_id: string;
    color: string;
}

let _cache: PopularSub[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function getPopularSubs(): Promise<PopularSub[]> {
    // Return cache if fresh
    if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
        return _cache;
    }

    try {
        const { data, error } = await supabase
            .from('popular_subscriptions')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        _cache = data as PopularSub[];
        _cacheTime = Date.now();
        return _cache;
    } catch {
        // Return stale cache or fallback
        if (_cache) return _cache;
        return FALLBACK_POPULAR;
    }
}

// Offline fallback — used when Supabase is unreachable and no cache exists
const FALLBACK_POPULAR: PopularSub[] = [
    { id: 'pop_netflix', name: 'Netflix', icon: '▶️', default_cost: 15.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#E50914' },
    { id: 'pop_spotify', name: 'Spotify', icon: '🎵', default_cost: 10.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#1DB954' },
    { id: 'pop_youtube', name: 'YouTube Premium', icon: '📺', default_cost: 13.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#FF0000' },
    { id: 'pop_chatgpt', name: 'ChatGPT Plus', icon: '🧠', default_cost: 20, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#10A37F' },
    { id: 'pop_icloud', name: 'iCloud+', icon: '☁️', default_cost: 2.99, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#3693F5' },
    { id: 'pop_github', name: 'GitHub Pro', icon: '⌨️', default_cost: 4, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#24292e' },
    { id: 'pop_figma', name: 'Figma Pro', icon: '✏️', default_cost: 12, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#A259FF' },
    { id: 'pop_gym', name: 'Gym', icon: '🏋️', default_cost: 49.99, default_cycle: 'monthly', category_id: 'cat_health', color: '#333333' },
    { id: 'pop_disney', name: 'Disney+', icon: '🎬', default_cost: 13.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#0057B8' },
    { id: 'pop_appletv', name: 'Apple TV+', icon: '📱', default_cost: 9.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#000000' },
];
