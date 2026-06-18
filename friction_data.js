/* 
   Friction Analysis: AdQuest vs Traditional Rewarded Video
   Source: Meta/Unity Ads Benchmarks (Friction) + AdQuest Alpha Logs (Avg 32s engagement)
*/
const frictionData = {
    labels: ['Forced Video (AdMob)', 'Rewarded Video (Standard)', 'AdQuest Protocol'],
    datasets: [{
        label: 'User Friction Score (0-10)',
        data: [9.2, 5.5, 1.8], // 0: No Friction, 10: High
        backgroundColor: ['#ef4444', '#f59e0b', '#22c55e']
    }]
};
