'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PowerCurveChartProps {
  data: { n: number; power: number }[];
  targetPower: number;
  targetN: number;
}

export default function PowerCurveChart({ data, targetPower, targetN }: PowerCurveChartProps) {
  return (
    <div className="w-full h-80 glass-card p-6 mt-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Power Curve</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
          <XAxis 
            dataKey="n" 
            label={{ value: 'Sample Size (n per group)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} 
            stroke="#64748b"
          />
          <YAxis 
            domain={[0, 105]} 
            label={{ value: 'Statistical Power (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
            stroke="#64748b"
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Power']}
            labelFormatter={(label) => `n = ${label}`}
            contentStyle={{ borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.2)', backgroundColor: 'rgba(12, 22, 45, 0.95)', color: '#f0f6ff' }}
            itemStyle={{ color: '#00d4ff' }}
          />
          <ReferenceLine y={targetPower * 100} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: `Target: ${targetPower * 100}%`, fill: '#f43f5e', fontSize: 12 }} />
          <ReferenceLine x={targetN} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: `n=${targetN}`, fill: '#10b981', fontSize: 12 }} />
          <Line 
            type="monotone" 
            dataKey="power" 
            stroke="var(--accent-cyan, #00d4ff)" 
            strokeWidth={3} 
            dot={{ r: 4, fill: 'var(--accent-cyan, #00d4ff)', strokeWidth: 0 }} 
            activeDot={{ r: 6, fill: 'var(--accent-cyan, #00d4ff)' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
