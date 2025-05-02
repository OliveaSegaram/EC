import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface Issue {
  id: string;
  deviceId: string;
  complaintType: string;
  description: string;
  priorityLevel: string;
  location: string;
  status: string;
}

const CheckStatus = () => {
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await api.get('/issues');
        setIssues(response.data.issues);
      } catch (error) {
        console.error('Error fetching issues:', error);
      }
    };
    fetchIssues();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Submitted Issues</h2>
      <div className="overflow-x-auto bg-white shadow-md rounded-xl p-4">
        <table className="min-w-full table-auto text-md">
          <thead>
            <tr className="text-left text-gray-700 bg-gray-200">
              <th className="px-5 py-3">Device ID</th>
              <th className="px-4 py-2">Complaint Type</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2">{issue.deviceId}</td>
                <td className="px-4 py-2">{issue.complaintType}</td>
                <td className="px-4 py-2">{issue.priorityLevel}</td>
                <td className="px-4 py-2">{issue.location}</td>
                <td className="px-4 py-2 font-semibold text-blue-700">{issue.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CheckStatus;
