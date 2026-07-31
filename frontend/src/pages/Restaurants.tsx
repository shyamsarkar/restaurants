import React, { useEffect, useState } from 'react';

import {
  BarChart,
  People,
  AttachMoney,
  TrendingUp,
  Timeline,
  CalendarToday,
  ShoppingBag,
  Receipt,
  Percent
} from '@mui/icons-material';

import { getReports, ReportData } from '@/services/api.service';

const Restaurants: React.FC = () => {
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getReports();
        setReport(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { title: 'Total Revenue', value: report ? `₹${report.metrics.total_revenue.toFixed(2)}` : 'Loading...', icon: AttachMoney, color: 'text-green-600' },
    { title: 'Orders Completed', value: report ? `${report.metrics.total_orders}` : 'Loading...', icon: ShoppingBag, color: 'text-blue-600' },
    { title: 'Taxes Collected', value: report ? `₹${report.metrics.total_tax.toFixed(2)}` : 'Loading...', icon: Receipt, color: 'text-purple-600' },
    { title: 'Discounts Offered', value: report ? `₹${report.metrics.total_discount.toFixed(2)}` : 'Loading...', icon: Percent, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Dashboard</h1>
        <p className="text-gray-600">Welcome to MealDesk POS. Realtime operational overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue by Payment Methods</h3>
            <BarChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {report?.payment_modes.length === 0 ? (
              <p className="text-slate-500 italic text-sm">No transaction details yet.</p>
            ) : (
              report?.payment_modes.map((mode) => (
                <div key={mode.mode} className="flex justify-between items-center p-2.5 bg-slate-55 bg-slate-50 rounded">
                  <span className="font-semibold text-sm text-slate-700">{mode.mode}</span>
                  <span className="font-bold text-slate-800">₹{mode.revenue.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue by Category</h3>
            <CalendarToday className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {report?.categories.length === 0 ? (
              <p className="text-slate-500 italic text-sm">No category sales recorded.</p>
            ) : (
              report?.categories.map((cat) => (
                <div key={cat.category} className="flex justify-between items-center p-2.5 bg-slate-50 rounded">
                  <span className="font-semibold text-sm text-slate-700">{cat.category}</span>
                  <span className="font-bold text-slate-800">₹{cat.revenue.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restaurants;
