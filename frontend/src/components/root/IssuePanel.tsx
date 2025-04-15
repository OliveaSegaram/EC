// src/pages/dashboards/components/IssuesTab.tsx
import React, { useEffect, useState } from 'react';

const IssuesTab: React.FC = () => {
  const [issues, setIssues] = useState<any[]>([]);

  const fetchIssues = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/issues', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setIssues(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Submitted Issues</h2>
      <table className="min-w-full bg-white rounded shadow">
        <thead className="bg-gray-200 text-left">
          <tr>
            <th className="p-3">Title</th>
            <th className="p-3">Description</th>
            <th className="p-3">Status</th>
            <th className="p-3">Submitted By</th>
          </tr>
        </thead>
        <tbody>
          {issues.map(issue => (
            <tr key={issue.id} className="border-t">
              <td className="p-3">{issue.title}</td>
              <td className="p-3">{issue.description}</td>
              <td className="p-3">{issue.status}</td>
              <td className="p-3">{issue.submittedBy?.username || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IssuesTab;
