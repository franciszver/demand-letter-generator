import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-toastify';

interface UserRelationship {
  id: string;
  primaryUserId: string;
  secondaryUserId: string;
  status: 'active' | 'inactive';
  secondaryUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  primaryUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<UserRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    if (!user || (user.role !== 'attorney' && user.role !== 'admin')) {
      toast.error('Access denied');
      navigate('/');
      return;
    }

    const fetchRelationships = async () => {
      try {
        setLoading(true);
        const response = await api.get('/user-relationships');
        if (response.data.success) {
          setRelationships(response.data.data || []);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to load relationships');
      } finally {
        setLoading(false);
      }
    };

    fetchRelationships();
  }, [user, navigate]);

  const handleDeactivate = async (relationshipId: string) => {
    try {
      const relationship = relationships.find(r => r.id === relationshipId);
      if (!relationship) return;

      await api.post('/user-relationships/deactivate', {
        secondaryUserId: relationship.secondaryUserId,
      });
      toast.success('Relationship deactivated');
      setRelationships(relationships.filter(r => r.id !== relationshipId));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to deactivate relationship');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-600 mt-2">Manage primary/secondary user relationships</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">User Relationships</h2>
        {relationships.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No relationships found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Primary User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secondary User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {relationships.map((rel) => (
                  <tr key={rel.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rel.primaryUser?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rel.secondaryUser?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rel.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rel.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {rel.status === 'active' && (
                        <button
                          onClick={() => handleDeactivate(rel.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;

