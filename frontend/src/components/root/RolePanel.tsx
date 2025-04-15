// src/pages/dashboards/components/RolesTab.tsx
import React, { useEffect, useState } from 'react';

const RolesTab: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [newRole, setNewRole] = useState('');

  const fetchRoles = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/root/roles', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/root/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newRole })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNewRole('');
      fetchRoles();
    } catch (err: any) {
      alert(err.message || 'Failed to add role');
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Roles</h2>

      <form onSubmit={handleAddRole} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New Role"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="border p-2 rounded w-60"
          required
        />
        <button type="submit" className="bg-purple-700 text-white px-4 py-2 rounded">
          Add Role
        </button>
      </form>

      <ul className="bg-white p-4 rounded shadow space-y-2">
        {roles.map((role) => (
          <li key={role.id} className="border-b py-1">{role.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default RolesTab;
