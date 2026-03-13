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
    // ── Drip ──
    { id: 'pop_drip', name: 'Drip', icon: 'svg:drip-fill', default_cost: 0, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#1A8CAF' },

    // ── Entertainment ──
    { id: 'pop_netflix', name: 'Netflix', icon: 'svg:netflix-fill', default_cost: 15.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#E60000' },
    { id: 'pop_spotify', name: 'Spotify', icon: 'svg:spotify-fill', default_cost: 10.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#1DB954' },
    { id: 'pop_youtube', name: 'YouTube Premium', icon: 'svg:youtube-fill', default_cost: 13.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#FFF' },
    { id: 'pop_hbomax', name: 'HBO Max', icon: 'svg:hbo-max-fill', default_cost: 15.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#B432D1' },
    { id: 'pop_prime', name: 'Amazon Prime', icon: 'svg:amazon-prime-fill', default_cost: 14.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#00A8E1' },
    { id: 'pop_applemusic', name: 'Apple Music', icon: 'svg:apple-music-fill', default_cost: 10.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#FA233B' },
    { id: 'pop_twitch', name: 'Twitch', icon: 'svg:twitch-fill', default_cost: 8.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#9146FF' },

    // ── Productivity, AI & Cloud ──
    { id: 'pop_chatgpt', name: 'ChatGPT Plus', icon: 'svg:openai-fill', default_cost: 20, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#10A37F' },
    { id: 'pop_claude', name: 'Claude', icon: 'svg:anthropic-fill', default_cost: 20, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#D97757' },
    { id: 'pop_gemini', name: 'Gemini', icon: 'svg:google-gemini-fill', default_cost: 19.99, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#4285F4' },
    { id: 'pop_grammarly', name: 'Grammarly', icon: 'svg:grammarly-fill', default_cost: 12, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#15C39A' },
    { id: 'pop_googleone', name: 'Google One', icon: 'svg:google-one-fill', default_cost: 2.99, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#FFFFFF' },
    { id: 'pop_icloud', name: 'iCloud+', icon: 'svg:icloud-fill', default_cost: 2.99, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#3693F5' },
    { id: 'pop_dropbox', name: 'Dropbox', icon: 'svg:dropbox-fill', default_cost: 11.99, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#0061FF' },
    { id: 'pop_m365', name: 'Microsoft 365', icon: 'svg:microsoft-fill', default_cost: 6.99, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#F25022' },
    { id: 'pop_notion', name: 'Notion', icon: 'svg:notion-fill', default_cost: 8, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#000000' },
    { id: 'pop_github', name: 'GitHub', icon: 'svg:github-fill', default_cost: 4, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#24292E' },
    { id: 'pop_figma', name: 'Figma', icon: 'svg:figma-fill', default_cost: 12, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#FFFFFF' },
    { id: 'pop_adobe', name: 'Adobe CC', icon: 'svg:adobe-fill', default_cost: 54.99, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#FF0000' },
    { id: 'pop_aws', name: 'AWS', icon: 'svg:aws-fill', default_cost: 29.99, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#FF9900' },

    // ── Communication & Social (5) ──
    { id: 'pop_slack', name: 'Slack', icon: 'svg:slack-fill', default_cost: 7.25, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#FFFFFF' },
    { id: 'pop_discord', name: 'Discord Nitro', icon: 'svg:discord-fill', default_cost: 9.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#5865F2' },
    { id: 'pop_linkedin', name: 'LinkedIn Premium', icon: 'svg:linkedin-fill', default_cost: 29.99, default_cycle: 'monthly', category_id: 'cat_productivity', color: '#0A66C2' },
    { id: 'pop_x', name: 'X Premium', icon: 'svg:x-fill', default_cost: 8, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#000000' },

    // ── Gaming (4) ──
    { id: 'pop_xbox', name: 'Xbox Game Pass', icon: 'svg:xbox-fill', default_cost: 14.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#FFFFFF' },
    { id: 'pop_playstation', name: 'PlayStation Plus', icon: 'svg:playstation-fill', default_cost: 9.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#003087' },
    { id: 'pop_nintendo', name: 'Nintendo Switch Online', icon: 'svg:nintendo-switch-fill', default_cost: 3.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#E60012' },
    { id: 'pop_steam', name: 'Steam', icon: 'svg:steam-fill', default_cost: 9.99, default_cycle: 'monthly', category_id: 'cat_entertainment', color: '#1B2838' },

    // ── Health & Fitness ──
    { id: 'pop_strava', name: 'Strava', icon: 'svg:strava-fill', default_cost: 7.99, default_cycle: 'monthly', category_id: 'cat_health', color: '#FFFFFF' },
    { id: 'pop_gym', name: 'Gym', icon: 'svg:gym-fill', default_cost: 49.99, default_cycle: 'monthly', category_id: 'cat_health', color: '#E05555' },

    // ── Finance & News ──
    { id: 'pop_medium', name: 'Medium', icon: 'svg:medium-fill', default_cost: 5, default_cycle: 'monthly', category_id: 'cat_finance', color: '#000000' },

    // ── Daily Life / Utilities (12) ──
    { id: 'pop_phone', name: 'Phone Plan', icon: 'svg:phone-fill', default_cost: 50, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#5B8FB9' },
    { id: 'pop_wifi', name: 'Internet/WiFi', icon: 'svg:wifi-fill', default_cost: 60, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#6CA0DC' },
    { id: 'pop_insurance', name: 'Insurance', icon: 'svg:insurance-fill', default_cost: 150, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#7BAE7F' },
    { id: 'pop_vpn', name: 'VPN', icon: 'svg:vpn-fill', default_cost: 9.99, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#7E8DB5' },
    { id: 'pop_electricity', name: 'Electricity', icon: 'svg:electricity-fill', default_cost: 100, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#E8B84B' },
    { id: 'pop_water', name: 'Water', icon: 'svg:water-fill', default_cost: 40, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#5DADE2' },
    { id: 'pop_rent', name: 'Rent/Mortgage', icon: 'svg:rent-fill', default_cost: 1500, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#C08552' },
    { id: 'pop_parking', name: 'Parking', icon: 'svg:parking-fill', default_cost: 100, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#6B8FB5' },
    { id: 'pop_cloudstorage', name: 'Cloud Storage', icon: 'svg:cloud-storage-fill', default_cost: 9.99, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#7DCEA0' },
    { id: 'pop_laundry', name: 'Laundry', icon: 'svg:laundry-fill', default_cost: 30, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#85C1E9' },
    { id: 'pop_carins', name: 'Car Insurance', icon: 'svg:car-insurance-fill', default_cost: 120, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#D4A76A' },
    { id: 'pop_gas', name: 'Gas/Fuel', icon: 'svg:gas-fill', default_cost: 100, default_cycle: 'monthly', category_id: 'cat_utilities', color: '#E67E50' },
];
