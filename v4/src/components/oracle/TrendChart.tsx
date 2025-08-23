/**
 * TrendChart - Visualize Oracle prediction trends and accuracy
 */

import { useState, useRef, useEffect } from 'react';
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Info,
  Calendar,
  Target
} from 'lucide-react';

interface DataPoint {
  week: number;
  accuracy?: number;
  predictions?: number;
  confidence?: number;
  value?: number;
}

interface TrendChartProps {
  title: string;
  data: DataPoint[];
  type?: 'line' | 'bar';
  color?: 'purple' | 'green' | 'blue' | 'red';
  showTrend?: boolean;
  height?: number;
}

export function TrendChart({ 
  title, 
  data, 
  type = 'line',
  color = 'purple',
  showTrend = true,
  height = 200
}: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const getColorScheme = () => {
    switch (color) {
      case 'green':
        return {
          primary: 'rgb(74, 222, 128)',
          secondary: 'rgba(74, 222, 128, 0.1)',
          gradient: ['rgba(74, 222, 128, 0.3)', 'rgba(74, 222, 128, 0)']
        };
      case 'blue':
        return {
          primary: 'rgb(96, 165, 250)',
          secondary: 'rgba(96, 165, 250, 0.1)',
          gradient: ['rgba(96, 165, 250, 0.3)', 'rgba(96, 165, 250, 0)']
        };
      case 'red':
        return {
          primary: 'rgb(248, 113, 113)',
          secondary: 'rgba(248, 113, 113, 0.1)',
          gradient: ['rgba(248, 113, 113, 0.3)', 'rgba(248, 113, 113, 0)']
        };
      default:
        return {
          primary: 'rgb(168, 85, 247)',
          secondary: 'rgba(168, 85, 247, 0.1)',
          gradient: ['rgba(168, 85, 247, 0.3)', 'rgba(168, 85, 247, 0)']
        };
    }
  };

  const calculateTrend = () => {
    if (data.length < 2) return 0;
    
    const values = data.map(d => d.accuracy || d.predictions || d.confidence || d.value || 0);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const colors = getColorScheme();
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;

    // Get data values
    const values = data.map(d => d.accuracy || d.predictions || d.confidence || d.value || 0);
    const maxValue = Math.max(...values) * 1.1;
    const minValue = Math.min(...values) * 0.9;
    const valueRange = maxValue - minValue;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(dimensions.width - padding.right, y);
      ctx.stroke();
    }

    if (type === 'line') {
      // Draw area fill
      const gradient = ctx.createLinearGradient(0, padding.top, 0, dimensions.height - padding.bottom);
      gradient.addColorStop(0, colors.gradient[0]);
      gradient.addColorStop(1, colors.gradient[1]);

      ctx.beginPath();
      ctx.moveTo(padding.left, dimensions.height - padding.bottom);

      data.forEach((point, index) => {
        const x = padding.left + (chartWidth * index) / (data.length - 1);
        const value = values[index];
        const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.lineTo(dimensions.width - padding.right, dimensions.height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw line
      ctx.beginPath();
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;

      data.forEach((point, index) => {
        const x = padding.left + (chartWidth * index) / (data.length - 1);
        const value = values[index];
        const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      data.forEach((point, index) => {
        const x = padding.left + (chartWidth * index) / (data.length - 1);
        const value = values[index];
        const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.fill();
        ctx.strokeStyle = 'rgb(31, 41, 55)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    } else {
      // Draw bars
      const barWidth = chartWidth / data.length * 0.6;
      const barSpacing = chartWidth / data.length * 0.4;

      data.forEach((point, index) => {
        const x = padding.left + (chartWidth * index) / data.length + barSpacing / 2;
        const value = values[index];
        const barHeight = ((value - minValue) / valueRange) * chartHeight;
        const y = padding.top + chartHeight - barHeight;
        
        // Bar gradient
        const barGradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        barGradient.addColorStop(0, colors.primary);
        barGradient.addColorStop(1, colors.secondary);
        
        ctx.fillStyle = barGradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }

    // Draw x-axis labels
    ctx.fillStyle = 'rgba(156, 163, 175, 0.7)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    data.forEach((point, index) => {
      const x = padding.left + (chartWidth * index) / (data.length - 1);
      ctx.fillText(`W${point.week}`, x, dimensions.height - padding.bottom + 20);
    });

    // Draw y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = minValue + (valueRange * (4 - i)) / 4;
      const y = padding.top + (chartHeight * i) / 4;
      ctx.fillText(value.toFixed(0), padding.left - 10, y + 4);
    }
  }, [data, dimensions, type, color]);

  const trend = calculateTrend();
  const latestValue = data[data.length - 1];
  const value = latestValue?.accuracy || latestValue?.predictions || latestValue?.confidence || latestValue?.value || 0;

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-xs text-gray-400">Last {data.length} weeks</p>
          </div>
        </div>
        
        {showTrend && (
          <div className="flex items-center space-x-2">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <span className={`text-sm font-bold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Current Value */}
      <div className="flex items-baseline space-x-2 mb-4">
        <span className="text-3xl font-bold text-white">{value.toFixed(1)}</span>
        <span className="text-sm text-gray-400">current</span>
      </div>

      {/* Chart Canvas */}
      <div className="relative" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseMove={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            
            const x = e.clientX - rect.left;
            const chartWidth = rect.width - 60;
            const index = Math.round((x - 40) / chartWidth * (data.length - 1));
            
            if (index >= 0 && index < data.length) {
              setHoveredPoint(data[index]);
            } else {
              setHoveredPoint(null);
            }
          }}
          onMouseLeave={() => setHoveredPoint(null)}
        />
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-gray-900 border border-purple-500/30 rounded-lg p-2 pointer-events-none">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">Week {hoveredPoint.week}</span>
            </div>
            <p className="text-sm font-bold text-white">
              {(hoveredPoint.accuracy || hoveredPoint.predictions || hoveredPoint.confidence || hoveredPoint.value || 0).toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full bg-${color}-400`} />
            <span className="text-xs text-gray-400">Actual</span>
          </div>
          {showTrend && (
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">Trend</span>
            </div>
          )}
        </div>
        
        <button className="p-1 rounded hover:bg-gray-700/50 transition-colors">
          <Info className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}