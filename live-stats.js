// live-stats.js — Dynamic stats from Supabase
// Include after env.js and supabase client

const SUPABASE_URL = window.ENV?.SUPABASE_URL || '';
const SUPABASE_ANON = window.ENV?.SUPABASE_ANON || '';

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON && typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
}

async function fetchLiveStats() {
    if (!supabaseClient) return null;

    try {
        // 1. Total unique users (from sessions table)
        const { data: sessions } = await supabaseClient
            .from('sessions')
            .select('user_id');

        const uniqueUsers = new Set(sessions?.map(s => s.user_id) || []);

        // 2. Total sessions
        const totalSessions = sessions?.length || 0;

        // 3. Attention events
        const { data: events } = await supabaseClient
            .from('attention_events')
            .select('phase, video_watch_duration_ms, challenge_duration_ms, was_correct, tier, challenge_attempts');

        const rewardEvents = events?.filter(e => e.phase === 'reward') || [];
        const challengeEvents = events?.filter(e => e.phase === 'challenge') || [];
        const videoEvents = events?.filter(e => e.phase === 'video') || [];

        // 4. Video completion (reward phase = video was watched)
        const videoStarted = videoEvents.length;
        const videoCompleted = rewardEvents.length;
        const videoCompletionRate = videoStarted > 0 ? Math.round((videoCompleted / videoStarted) * 100) : 0;

        // 5. Challenge completion
        const challengeCompleted = rewardEvents.filter(e => e.was_correct === true).length;
        const challengeCompletionRate = challengeEvents.length > 0
            ? Math.round((challengeCompleted / challengeEvents.length) * 100)
            : 0;

        // 6. Average engagement time (from reward events)
        const engagementTimes = rewardEvents
            .map(e => (e.video_watch_duration_ms || 0) + (e.challenge_duration_ms || 0))
            .filter(t => t > 0);
        const avgEngagement = engagementTimes.length > 0
            ? Math.round(engagementTimes.reduce((a, b) => a + b, 0) / engagementTimes.length / 1000)
            : 0;

        // 7. Tier distribution
        const tiers = { gold: 0, silver: 0, bronze: 0 };
        rewardEvents.forEach(e => {
            if (e.tier && tiers[e.tier] !== undefined) tiers[e.tier]++;
        });

        // 8. Full flow completion (users who went through all phases)
        const sessionPhases = {};
        events?.forEach(e => {
            if (!sessionPhases[e.session_id]) sessionPhases[e.session_id] = new Set();
            sessionPhases[e.session_id].add(e.phase);
        });
        const fullFlowSessions = Object.values(sessionPhases).filter(
            p => p.has('primer') || p.has('video')
        ).length;
        const fullFlowCompleted = Object.values(sessionPhases).filter(
            p => p.has('reward')
        ).length;
        const fullFlowRate = fullFlowSessions > 0
            ? Math.round((fullFlowCompleted / fullFlowSessions) * 100)
            : 0;

        return {
            uniqueUsers: uniqueUsers.size,
            totalSessions,
            videoStarted,
            videoCompleted,
            videoCompletionRate,
            challengeCompleted,
            challengeCompletionRate,
            avgEngagement,
            tiers,
            fullFlowSessions,
            fullFlowCompleted,
            fullFlowRate,
            totalEvents: events?.length || 0,
            lastUpdated: new Date().toISOString()
        };
    } catch (err) {
        console.error('fetchLiveStats error:', err);
        return null;
    }
}

// Update DOM elements with live data
function updateStatsDOM(stats) {
    if (!stats) return;

    document.querySelectorAll('[data-stat]').forEach(el => {
        const key = el.getAttribute('data-stat');
        if (stats[key] !== undefined && stats[key] !== null) {
            let val = stats[key];
            // Add suffix based on key
            if (key === 'avgEngagement') val = val + 's';
            else if (key === 'videoCompletionRate' || key === 'challengeCompletionRate' || key === 'fullFlowRate') val = val + '%';
            el.textContent = val;
        }
    });

    // Update "last updated" if element exists
    const updatedEl = document.querySelector('[data-stat="lastUpdated"]');
    if (updatedEl && stats.lastUpdated) {
        const d = new Date(stats.lastUpdated);
        updatedEl.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Auto-fetch on page load
document.addEventListener('DOMContentLoaded', async () => {
    const stats = await fetchLiveStats();
    if (stats) {
        updateStatsDOM(stats);
        window.__LIVE_STATS = stats;
    }
});
