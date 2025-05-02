import React, { useEffect, useState } from 'react';
import { CiWallet } from 'react-icons/ci';

const RegistrationPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    const res = await fetch('http://localhost:5000/api/root/users', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const total = users.length;
  const verified = users.filter(u => u.isVerified).length;
  const pending = total - verified;

  return (
    <div className="p-4 space-y-6">
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <h4 className="font-bold text-gray-700">Total Registrations</h4>
          <CiWallet className="text-gray-700 cursor-pointer" size={20}/>
          <p className="text-2xl">{total}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <h4 className="font-bold text-gray-700">Verified Users</h4>
          <p className="text-2xl">{verified}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
          <h4 className="font-bold text-gray-700">Pending Approvals</h4>
          <p className="text-2xl">{pending}</p>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Username</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Attachment</th>
              <th className="p-3">Notify</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.username}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.Role?.name}</td>
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="p-3">
                  {user.attachment ? (
                    <a href={`http://localhost:5000/${user.attachment}`} className="text-blue-600 underline" target="_blank" rel="noreferrer">View</a>
                  ) : '—'}
                </td>
                <td className="p-3">
                  <a href={`mailto:${user.email}`} className="text-blue-600 underline">Email</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegistrationPanel;
