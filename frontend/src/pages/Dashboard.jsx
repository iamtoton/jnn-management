import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statsCards = [
    {
      title: "Today's Collection",
      value: data?.stats?.todayCollection || 0,
      icon: Calendar,
      color: 'bg-blue-500',
      onClick: () => navigate('/history')
    },
    {
      title: 'Monthly Collection',
      value: data?.stats?.monthlyCollection || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      onClick: () => navigate('/history')
    },
    {
      title: 'Yearly Collection',
      value: data?.stats?.yearlyCollection || 0,
      icon: DollarSign,
      color: 'bg-purple-500',
      onClick: () => navigate('/history')
    },
    {
      title: 'Total Students',
      value: data?.stats?.totalStudents || 0,
      icon: Users,
      color: 'bg-orange-500',
      onClick: () => navigate('/students')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 text-white p-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-white/90">Welcome to J.N.N Youth Centre Management System</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={card.onClick}
              className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {card.title.includes('Collection') 
                      ? formatCurrency(card.value)
                      : card.value
                    }
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-primary-600 group-hover:translate-x-1 transition-transform">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Chart */}
        <div className="card p-6 bg-gradient-to-br from-white to-blue-50/30">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-purple-500 rounded-full"></span>
            Monthly Collection Trend
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#0ea5e9" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card bg-gradient-to-br from-white to-emerald-50/30">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></span>
                Recent Transactions
              </h2>
              <button 
                onClick={() => navigate('/history')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {(data?.recentTransactions || []).slice(0, 8).map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold text-sm">
                        {transaction.student?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.student?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.month} {transaction.year} • {transaction.student?.course}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">
                    +{formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
            ))}
            {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                No recent transactions found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
