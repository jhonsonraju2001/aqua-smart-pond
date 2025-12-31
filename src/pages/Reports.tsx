import { useParams, useNavigate } from 'react-router-dom';
import { usePondData, useSensorData } from '@/hooks/usePondData';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Generate mock historical data
const generateHistoricalData = (days: number) => {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ph: 7.2 + Math.random() * 0.6 - 0.3,
      do: 5.5 + Math.random() * 1.5 - 0.5,
      temperature: 27 + Math.random() * 3 - 1.5,
    });
  }
  
  return data;
};

const chartConfig = {
  ph: { label: 'pH Level', color: 'hsl(var(--status-safe))' },
  do: { label: 'Dissolved Oxygen', color: 'hsl(var(--primary))' },
  temperature: { label: 'Temperature', color: 'hsl(var(--status-warning))' },
};

export default function Reports() {
  const { pondId } = useParams<{ pondId: string }>();
  const navigate = useNavigate();
  const { ponds, isLoading: pondsLoading } = usePondData();
  const { sensorData } = useSensorData(pondId || '');

  const pond = ponds.find(p => p.id === pondId) || (ponds.length === 1 ? ponds[0] : null);

  if (pondsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pond) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Pond Not Found</h2>
          <Button onClick={() => navigate('/')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const weeklyData = generateHistoricalData(7);
  const monthlyData = generateHistoricalData(30);

  // Calculate trends
  const getTrend = (data: typeof weeklyData, key: 'ph' | 'do' | 'temperature') => {
    if (data.length < 2) return 'stable';
    const first = data[0][key];
    const last = data[data.length - 1][key];
    const diff = last - first;
    if (diff > 0.3) return 'up';
    if (diff < -0.3) return 'down';
    return 'stable';
  };

  const renderTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-status-safe" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-status-critical" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const summaryStats = [
    { 
      label: 'pH Level', 
      value: sensorData?.ph.toFixed(2) || '--', 
      trend: getTrend(weeklyData, 'ph'),
      color: 'from-status-safe to-emerald-600'
    },
    { 
      label: 'Dissolved O₂', 
      value: `${sensorData?.dissolvedOxygen.toFixed(1) || '--'} mg/L`, 
      trend: getTrend(weeklyData, 'do'),
      color: 'from-primary to-blue-600'
    },
    { 
      label: 'Temperature', 
      value: `${sensorData?.temperature.toFixed(1) || '--'}°C`, 
      trend: getTrend(weeklyData, 'temperature'),
      color: 'from-status-warning to-orange-600'
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Reports" showBack />
      
      <main className="p-4 max-w-lg mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{pond.name}</h2>
            <p className="text-xs text-muted-foreground">
              Analytics & trend reports
            </p>
          </div>
        </motion.div>

        {/* Current Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-3 gap-2 mb-6"
        >
          {summaryStats.map((stat, index) => (
            <div 
              key={stat.label}
              className="p-3 rounded-2xl bg-card border shadow-sm"
            >
              <p className="text-[10px] text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-sm font-bold text-foreground">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {renderTrendIcon(stat.trend)}
                <span className="text-[10px] text-muted-foreground capitalize">{stat.trend}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Charts */}
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="weekly" className="flex-1">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="mt-0 space-y-4">
            {/* pH Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-status-safe" />
                    pH Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[120px] w-full">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="phGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--status-safe))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--status-safe))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="ph" 
                        stroke="hsl(var(--status-safe))" 
                        fill="url(#phGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* DO Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    Dissolved Oxygen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[120px] w-full">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="doGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="do" 
                        stroke="hsl(var(--primary))" 
                        fill="url(#doGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Temperature Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-status-warning" />
                    Temperature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[120px] w-full">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--status-warning))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--status-warning))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="hsl(var(--status-warning))" 
                        fill="url(#tempGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="monthly" className="mt-0 space-y-4">
            {/* Same structure for monthly data */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-status-safe" />
                  pH Level (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[120px] w-full">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="phGradientMonthly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--status-safe))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--status-safe))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="ph" 
                      stroke="hsl(var(--status-safe))" 
                      fill="url(#phGradientMonthly)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  Dissolved Oxygen (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[120px] w-full">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="doGradientMonthly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="do" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#doGradientMonthly)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-status-warning" />
                  Temperature (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[120px] w-full">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="tempGradientMonthly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--status-warning))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--status-warning))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="hsl(var(--status-warning))" 
                      fill="url(#tempGradientMonthly)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
