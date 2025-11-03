import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics', {
        params: { period },
      });
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Detailed analytics and insights for the last {period} days.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Metrics</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Total Users</dt>
                <dd className="text-sm font-semibold text-gray-900">{analytics?.users.total}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">New Users</dt>
                <dd className="text-sm font-semibold text-gray-900">{analytics?.users.new}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Trial Users</dt>
                <dd className="text-sm font-semibold text-gray-900">{analytics?.users.trial}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Expired Trials</dt>
                <dd className="text-sm font-semibold text-gray-900">{analytics?.users.expiredTrial}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Daily Active Users</dt>
                <dd className="text-sm font-semibold text-gray-900">{analytics?.users.dau}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Metrics</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Active Subscriptions</dt>
                <dd className="text-sm font-semibold text-gray-900">{analytics?.subscriptions.active}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Monthly Revenue</dt>
                <dd className="text-sm font-semibold text-green-600">
                  ${analytics?.subscriptions.monthlyRevenue.toFixed(2)}
                </dd>
              </div>
              {analytics?.subscriptions.breakdown.map((item: any) => (
                <div key={item.plan} className="flex justify-between">
                  <dt className="text-sm text-gray-500">{item.plan.toUpperCase()}</dt>
                  <dd className="text-sm font-semibold text-gray-900">{item._count}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Message Metrics</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Total Messages</dt>
                <dd className="text-sm font-semibold text-gray-900">{analytics?.messages.total}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Messages in Period</dt>
                <dd className="text-sm font-semibold text-gray-900">{analytics?.messages.inPeriod}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Total Tokens</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {analytics?.messages.totalTokens.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Avg per User</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {analytics?.users.total
                    ? Math.round(analytics.messages.total / analytics.users.total)
                    : 0}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="border-l-4 border-primary-500 pl-4">
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.users.total && analytics?.subscriptions.active
                ? ((analytics.subscriptions.active / analytics.users.total) * 100).toFixed(1)
                : '0'}%
            </p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-500">ARPU</p>
            <p className="text-2xl font-bold text-gray-900">
              ${analytics?.subscriptions.active
                ? (analytics.subscriptions.monthlyRevenue / analytics.subscriptions.active).toFixed(2)
                : '0.00'}
            </p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-500">Engagement Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.users.total && analytics?.users.dau
                ? ((analytics.users.dau / analytics.users.total) * 100).toFixed(1)
                : '0'}%
            </p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <p className="text-sm text-gray-500">Trial Conversion</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.users.trial && analytics?.subscriptions.active
                ? ((analytics.subscriptions.active / (analytics.users.trial + analytics.subscriptions.active)) * 100).toFixed(1)
                : '0'}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
