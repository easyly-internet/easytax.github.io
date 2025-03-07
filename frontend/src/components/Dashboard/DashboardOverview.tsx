import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import _ from 'lodash';

// Sample dashboard data - replace with actual API calls
const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalDocuments: 0,
    pendingReviews: 0
  });

  const [filingStatusData, setFilingStatusData] = useState([]);
  const [monthlyActivity, setMonthlyActivity] = useState([]);

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      try {
        // In a real app, replace with actual API calls
        setLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data
        setStats({
          totalMembers: 342,
          activeMembers: 285,
          totalDocuments: 1247,
          pendingReviews: 28
        });

        setFilingStatusData([
          { name: 'Not Started', value: 120, color: '#e0e0e0' },
          { name: 'In Progress', value: 180, color: '#64b5f6' },
          { name: 'Under Review', value: 28, color: '#ffb74d' },
          { name: 'Completed', value: 14, color: '#81c784' }
        ]);

        setMonthlyActivity([
          { month: 'Jan', documents: 45, filings: 12 },
          { month: 'Feb', documents: 63, filings: 18 },
          { month: 'Mar', documents: 124, filings: 22 },
          { month: 'Apr', documents: 85, filings: 30 },
          { month: 'May', documents: 97, filings: 42 },
          { month: 'Jun', documents: 110, filings: 27 },
          { month: 'Jul', documents: 68, filings: 21 }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of tax filing activity and statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalMembers}</dd>
            <dd className="mt-1 text-sm text-gray-500">{stats.activeMembers} active</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Documents</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalDocuments}</dd>
            <dd className="mt-1 text-sm text-gray-500">Last 30 days</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Pending Reviews</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 flex items-center">
              {stats.pendingReviews}
              {stats.pendingReviews > 10 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  !
                </span>
              )}
            </dd>
            <dd className="mt-1 text-sm text-gray-500">Needs attention</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {Math.round((stats.activeMembers / stats.totalMembers) * 100)}%
            </dd>
            <dd className="mt-1 text-sm text-gray-500">Member activation</dd>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Monthly Activity</h3>
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyActivity}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="documents" name="Documents Uploaded" fill="#8884d8" />
                  <Bar dataKey="filings" name="Tax Filings" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Filing Status</h3>
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filingStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {filingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} members`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;