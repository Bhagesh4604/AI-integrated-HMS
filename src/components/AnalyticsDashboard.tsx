import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  StackedAreaChart,
  LinearXAxis,
  LinearXAxisTickSeries,
  LinearXAxisTickLabel,
  LinearYAxis,
  LinearYAxisTickSeries,
  StackedAreaSeries,
  Line,
  Area,
  Gradient,
  GradientStop,
  GridlineSeries,
  Gridline,
} from 'reaviz';
import apiUrl from '@/config/api';
import { BedDouble, Clock, Users, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const AnalyticsDashboard = () => {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({});

  const padData = (data, days) => {
    const paddedData = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toISOString().slice(0, 10);
      const existingData = data.find(d => d.date.slice(0, 10) === formattedDate);
      paddedData.push({
        key: date,
        data: existingData?.count || 0,
      });
    }
    return paddedData.reverse();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(apiUrl('/api/analytics/summary'));
        const data = await response.json();

        const admissionsData = Array.isArray(data.admissionsLast7Days) ? data.admissionsLast7Days : [];
        const appointmentsData = Array.isArray(data.appointmentsLast7Days) ? data.appointmentsLast7Days : [];

        const admissions = padData(admissionsData, 7).map(d => ({ key: new Date(d.key), data: d.data }));
        const appointments = padData(appointmentsData, 7).map(d => ({ key: new Date(d.key), data: d.data }));

        setChartData([
          { key: 'Admissions', data: admissions },
          { key: 'Appointments', data: appointments },
        ]);

        const getSafeNumber = (value) => {
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        };

        setStats({
          newPatients: getSafeNumber(data.newPatientsToday?.[0]?.count),
          todaysAppointments: getSafeNumber(data.appointmentsToday?.[0]?.count),
          bedOccupancy: getSafeNumber(data.bedOccupancy?.[0]?.total) > 0 ? (getSafeNumber(data.bedOccupancy?.[0]?.occupied) / getSafeNumber(data.bedOccupancy?.[0]?.total)) * 100 : 0,
          avgWaitTime: 25,
          totalRevenue: getSafeNumber(data.totalRevenue?.[0]?.total),
          revenueToday: getSafeNumber(data.revenueToday?.[0]?.total),
        });

      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      }
    };

    fetchData();
  }, []);

  const LEGEND_ITEMS = [
    { name: 'Admissions', color: '#6366f1' }, // Indigo-500
    { name: 'Appointments', color: '#06b6d4' }, // Cyan-500
  ];

  const CHART_COLOR_SCHEME = ['#6366f1', '#06b6d4'];

  const StatBox = ({ title, value, prefix = "", suffix = "" }) => (
    <div className="flex flex-col gap-1 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
      <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
      <CountUp
        className="font-mono text-3xl font-black text-gray-900 dark:text-white"
        prefix={prefix}
        suffix={suffix}
        end={value || 0}
        duration={2}
        separator=","
      />
    </div>
  );

  return (
    <div className="p-4 w-full max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 relative overflow-hidden">

        {/* Background Blurs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        {/* Header */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-300">
              Hospital Analytics
            </h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Real-time performance metrics.</p>
          </div>

          {/* Legend */}
          <div className="flex gap-4">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.name} className="flex gap-2 items-center bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="relative z-10 h-[300px] w-full mb-8">
          {chartData.length > 0 && (
            <StackedAreaChart
              height={300}
              data={chartData}
              xAxis={
                <LinearXAxis
                  type="time"
                  tickSeries={
                    <LinearXAxisTickSeries
                      label={
                        <LinearXAxisTickLabel
                          format={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          fill="currentColor"
                          className="text-xs font-medium fill-gray-400 dark:fill-gray-500"
                        />
                      }
                      line={null}
                    />
                  }
                  axisLine={null}
                />
              }
              yAxis={
                <LinearYAxis
                  axisLine={null}
                  tickSeries={<LinearYAxisTickSeries line={null} label={null} />}
                />
              }
              series={
                <StackedAreaSeries
                  line={<Line strokeWidth={3} />}
                  area={
                    <Area
                      gradient={
                        <Gradient
                          stops={[
                            <GradientStop key={1} offset="0%" stopOpacity={0.4} />,
                            <GradientStop key={2} offset="100%" stopOpacity={0} />,
                          ]}
                        />
                      }
                    />
                  }
                  colorScheme={CHART_COLOR_SCHEME}
                />
              }
              gridlines={<GridlineSeries line={<Gridline strokeClassName="stroke-gray-100 dark:stroke-white/5" />} />}
            />
          )}
        </div>

        {/* Stats Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatBox title="New Patients" value={stats.newPatients} />
          <StatBox title="Today's Appts" value={stats.todaysAppointments} />
          <StatBox title="Daily Revenue" value={stats.revenueToday} prefix="$" />
          <StatBox title="Total Revenue" value={stats.totalRevenue} prefix="$" />
        </div>

        {/* Detailed Metrics */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.01 }} className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
            <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/30">
              <BedDouble size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bed Occupancy Rate</p>
              <p className="text-2xl font-black text-indigo-900 dark:text-indigo-100">{Number(stats.bedOccupancy || 0).toFixed(1)}%</p>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.01 }} className="flex items-center gap-4 p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20">
            <div className="p-3 bg-cyan-500 rounded-xl text-white shadow-lg shadow-cyan-500/30">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg. Wait Time</p>
              <p className="text-2xl font-black text-cyan-900 dark:text-cyan-100">{stats.avgWaitTime || 0} min</p>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
