import { useEffect, useState } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  phone?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  isBanned: boolean;
  createdAt: string;
  _count: { messages: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: { limit: 100, search },
      });
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, email: string) => {
    if (!confirm(`Ban user ${email}?`)) return;

    const reason = prompt('Ban reason:');
    if (!reason) return;

    try {
      await api.post(`/admin/users/${userId}/ban`, { reason });
      alert('User banned successfully');
      loadUsers();
    } catch (error) {
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string, email: string) => {
    if (!confirm(`Unban user ${email}?`)) return;

    try {
      await api.post(`/admin/users/${userId}/unban`);
      alert('User unbanned successfully');
      loadUsers();
    } catch (error) {
      alert('Failed to unban user');
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
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all users including their email, subscription status, and activity.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <input
          type="text"
          placeholder="Search users..."
          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && loadUsers()}
        />
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Subscription</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Messages</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Joined</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.phone || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {user.subscriptionStatus === 'active' ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            {user.subscriptionPlan?.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-gray-500">Trial</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user._count.messages}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {user.isBanned ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {user.isBanned ? (
                          <button
                            onClick={() => handleUnbanUser(user.id, user.email)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
