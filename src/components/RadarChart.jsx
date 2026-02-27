import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * RadarChart Component
 * @param {Object} data - Format: { TopicName: { attempted: X, correct: Y }, ... }
 * @param {number} size - Square size of the chart
 */
const RadarChart = ({ data = {}, size = 400 }) => {
    const padding = 60;
    const center = size / 2;
    const radius = center - padding;

    // Filter and prepare axes: Top 6 topics by attempts, or default set if empty
    const axes = useMemo(() => {
        const entries = Object.entries(data);
        if (entries.length === 0) {
            return ['Logic', 'Arrays', 'Pointers', 'OOP', 'Strings', 'Memory'].map(topic => ({ topic, value: 0.5 }));
        }

        return entries
            .sort((a, b) => a[0].localeCompare(b[0])) // Fix: Alphabetical sort for stability
            .slice(0, 7)
            .map(([topic, stats]) => {
                const accuracy = stats.attempted > 0 ? stats.correct / stats.attempted : 0;
                // Add a small floor (0.05) so 0% is still visible near center
                return { topic, value: Math.max(0.05, accuracy) };
            });
    }, [data]);

    const angleStep = (Math.PI * 2) / axes.length;

    // Helper to get coordinates
    const getCoords = (value, index) => {
        const x = center + radius * value * Math.sin(index * angleStep);
        const y = center - radius * value * Math.cos(index * angleStep);
        return { x, y };
    };

    // Grid Levels (Concentric lines)
    const gridLevels = [0.25, 0.5, 0.75, 1];

    // Data points for the polygon
    const points = axes.map((d, i) => getCoords(d.value, i));
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="flex items-center justify-center p-4 bg-[#161b22]/50 rounded-3xl border border-gray-800 backdrop-blur-sm relative group overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#58a6ff]/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative z-10 drop-shadow-[0_0_10px_rgba(88,166,255,0.15)]">
                {/* 1. Grid Lines (Hexagon/Pentagon shapes) */}
                {gridLevels.map((level, i) => {
                    const gridPoints = axes.map((_, idx) => getCoords(level, idx));
                    const gridPointsStr = gridPoints.map(p => `${p.x},${p.y}`).join(' ');
                    return (
                        <polygon
                            key={i}
                            points={gridPointsStr}
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* 2. Axis Spokes */}
                {axes.map((_, i) => {
                    const outer = getCoords(1, i);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={outer.x}
                            y2={outer.y}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* 2.5 Axis Value Labels (Vertical Axis) */}
                {gridLevels.map((level, i) => (
                    <g key={`label-${i}`}>
                        <rect
                            x={center - 15}
                            y={center - radius * level - 8}
                            width="30"
                            height="16"
                            rx="8"
                            fill="#161b22"
                            className="stroke-gray-800"
                        />
                        <text
                            x={center}
                            y={center - radius * level}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            className="fill-gray-400 text-[9px] font-mono font-bold"
                        >
                            {Math.round(level * 100)}
                        </text>
                    </g>
                ))}

                {/* 3. The Data Polygon */}
                <motion.polygon
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    points={pointsStr}
                    fill="rgba(88, 166, 255, 0.2)"
                    stroke="#58a6ff"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_8px_rgba(88,166,255,0.4)]"
                />

                {/* 4. Data Points & Labels */}
                {axes.map((d, i) => {
                    const point = getCoords(d.value, i);
                    const labelPos = getCoords(1.15, i);

                    return (
                        <g key={i}>
                            <motion.circle
                                initial={{ r: 0 }}
                                animate={{ r: 4 }}
                                cx={point.x}
                                cy={point.y}
                                fill="#58a6ff"
                                shadow="0 0 10px #58a6ff"
                            />
                            <text
                                x={labelPos.x}
                                y={labelPos.y}
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                className="fill-gray-400 text-[10px] font-bold uppercase tracking-wider select-none"
                            >
                                {d.topic}
                            </text>
                        </g>
                    );
                })}

                {/* Center dot */}
                <circle cx={center} cy={center} r="2" fill="rgba(255,255,255,0.1)" />
            </svg>

            {/* Labels overlay for values */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-1 opacity-20">
                <div className="w-12 h-[1px] bg-gray-700"></div>
                <div className="text-[10px] text-gray-500 font-mono">SKILL MATRIX</div>
                <div className="w-12 h-[1px] bg-gray-700"></div>
            </div>
        </div>
    );
};

export default RadarChart;
