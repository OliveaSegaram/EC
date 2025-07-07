import React, { useEffect, useState, useCallback } from 'react';
import { FaTrash } from 'react-icons/fa';
import { useAppContext } from '../../provider/AppContext';
import type { JSX } from 'react/jsx-runtime';
import { toast } from 'react-toastify';
import Button from '../ui/buttons/Button';

const RolePanel: React.FC = (): JSX.Element => {  
  
  const { backendUrl } = useAppContext();
  const [roles, setRoles] = useState<any[]>([]);
  const [newRole, setNewRole] = useState('');

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/root/roles`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    }
  }, [backendUrl]);

  const handleAdd = async () => {
    if (!newRole.trim()) return;

    const res = await fetch(`${backendUrl}/root/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ name: newRole }),
    });

    if (res.ok) {
      setNewRole('');
      fetchRoles();
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`${backendUrl}/root/roles/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    toast.success('Role deleted successfully');
    fetchRoles();
  };

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]); // Added fetchRoles to the dependency array

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-800">Manage Roles</h2>

      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          placeholder="Enter new role name"
          className="px-4 py-2 border rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <Button
          buttonText="Add"
          buttonColor="#6e2f74"
          buttonStyle={2}
          textColor="white"
          onClick={handleAdd}
          className="px-5 py-2"
        />
      </div>

      <ul className="space-y-3">
        {roles.map((role) => (
          <li
            key={role.id}
            className="flex justify-between items-center px-4 py-2 bg-white rounded shadow border hover:shadow-md transition-all"
          >
            <span className="text-gray-700 font-medium capitalize">{role.name}</span>
            <button
              onClick={() => handleDelete(role.id)}
              className="text-red-600 hover:text-red-800 transition duration-150"
              title="Delete"
            >
              <FaTrash /> 
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RolePanel;
