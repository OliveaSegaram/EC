import React, { useEffect, useState, useRef } from 'react';
import { CiWallet } from 'react-icons/ci';
import { FiCheck, FiX, FiAlertTriangle, FiEye } from 'react-icons/fi';
import axios from 'axios';

const RegistrationPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const detailsModalRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Number of items per page
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);
  
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/root/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle approve user
  const handleApprove = async (userId: number) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('Approving user with ID:', userId);
      
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.post(
        `http://localhost:5000/api/root/approve-user/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Approval response:', response.data);
      
      setSuccess('User approved successfully');
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error approving user:', error);
      if (error.response) {
        console.log('Error response:', error.response.data);
        console.log('Error status:', error.response.status);
      }
      setError(error.response?.data?.message || 'Failed to approve user');
    } finally {
      setLoading(false);
    }
  };
  
  // Open reject modal
  const openRejectModal = (userId: number) => {
    setSelectedUserId(userId);
    setRejectionReason('');
    setShowRejectModal(true);
  };
  
  // Handle reject user
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('Rejecting user with ID:', selectedUserId);
      console.log('Rejection reason:', rejectionReason);
      
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.post(
        `http://localhost:5000/api/root/reject-user/${selectedUserId}`,
        { rejectionReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Rejection response:', response.data);
      
      setSuccess('User rejected successfully');
      setShowRejectModal(false);
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      if (error.response) {
        console.log('Error response:', error.response.data);
        console.log('Error status:', error.response.status);
      }
      setError(error.response?.data?.message || 'Failed to reject user');
    } finally {
      setLoading(false);
    }
  };
  
  // Open details modal
  const openDetailsModal = (user: any) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowRejectModal(false);
      }
      if (detailsModalRef.current && !detailsModalRef.current.contains(event.target as Node)) {
        setShowDetailsModal(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      {/* Status messages */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex items-center">
          <FiAlertTriangle className="mr-2" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-700 hover:text-red-900">
            <FiX />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 flex items-center">
          <FiCheck className="mr-2" />
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto text-green-700 hover:text-green-900">
            <FiX />
          </button>
        </div>
      )}
      
      {/* User Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.Role?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                  <button 
                    onClick={() => openDetailsModal(user)} 
                    className="text-blue-600 hover:text-blue-800"
                    title="View Details"
                  >
                    <FiEye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        {users.length > itemsPerPage && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {indexOfLastItem > users.length ? users.length : indexOfLastItem}
                  </span>{' '}
                  of <span className="font-medium">{users.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === number
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div ref={modalRef} className="relative top-20 mx-auto p-0 border w-4/5 max-w-md shadow-lg rounded-md bg-white overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-medium text-gray-800">Reject Registration</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-500 text-xl font-semibold"
              >
                ×
              </button>
            </div>
            
            <div className="p-5">
              <p className="mb-3 text-gray-600">Please provide a reason for rejecting this registration:</p>
              
              <textarea
                className="w-full border border-gray-300 rounded-md p-3 mb-4 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-5">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div ref={detailsModalRef} className="relative top-20 mx-auto p-0 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white overflow-hidden">
            {/* Header with status indicator */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <div className="flex items-center">
                <h3 className="text-lg font-medium">User: {selectedUser.username}</h3>
                <span className={`ml-3 px-2 py-1 rounded-full text-xs ${selectedUser.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {selectedUser.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-500 text-xl font-semibold"
              >
                ×
              </button>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Username</h4>
                  <p className="mt-1 text-gray-900 font-medium">{selectedUser.username}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p className="mt-1 text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Role</h4>
                  <p className="mt-1 text-gray-900">{selectedUser.Role?.name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                  <p className="mt-1 text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                
                {selectedUser.attachment && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Attachment</h4>
                    <a
                      href={`http://localhost:5000/uploads/${selectedUser.attachment.split(/[\\/]/).pop()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block px-3 py-1 bg-blue-50 text-blue-600 hover:text-blue-800 rounded border border-blue-200 transition-colors"
                    >
                      View Attachment
                    </a>
                  </div>
                )}
              </div>
              
              {/* Action buttons footer - only shown for pending users */}
              {!selectedUser.isVerified && (
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button
                      onClick={() => {
                        handleApprove(selectedUser.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex items-center justify-center bg-white border border-green-500 text-green-700 hover:bg-green-50 rounded-md transition-all shadow-sm hover:shadow py-2 px-4 w-full sm:w-auto sm:min-w-[140px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                      <FiCheck className="mr-2" size={18} />
                      <span className="font-medium">Approve User</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        openRejectModal(selectedUser.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex items-center justify-center bg-white border border-red-500 text-red-700 hover:bg-red-50 rounded-md transition-all shadow-sm hover:shadow py-2 px-4 w-full sm:w-auto sm:min-w-[140px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                      <FiX className="mr-2" size={18} />
                      <span className="font-medium">Reject User</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPanel;
