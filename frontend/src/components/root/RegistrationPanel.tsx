import React, { useEffect, useState } from 'react';

const RegistrationTab: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/root/pending-users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">User Registrations</h2>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Attachment</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t">
              <td className="p-3">{user.username}</td>
              <td className="p-3">{user.email}</td>
              <td className="p-3">{user.Role?.name}</td>
              <td className="p-3">
                {user.attachment ? (
                  <a href={`http://localhost:5000/${user.attachment}`} target="_blank" rel="noreferrer" className="text-blue-500 underline">View</a>
                ) : '—'}
              </td>
              <td className="p-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.isVerified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {user.isVerified ? 'Verified' : 'Pending'}
                </span>
              </td>
              <td className="p-3">
                <a
                  href={`mailto:${user.email}`}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Notify
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RegistrationTab;
