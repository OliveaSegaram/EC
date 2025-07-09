import React, { useEffect, useState, useRef, useContext } from 'react';
import { CiWallet } from 'react-icons/ci';
import { FiCheck, FiX, FiAlertTriangle, FiEye } from 'react-icons/fi';
import Button from '../ui/buttons/Button';
import axios from 'axios';
import { AppContext } from '../../provider/AppContext';
import { useTranslation } from 'react-i18next';
import SimplePagination from '../common/SimplePagination';
import { useSimplePagination } from '../../hooks/useSimplePagination';



const RegistrationPanel: React.FC = () => {
   const appContex = useContext(AppContext);
  if (!appContex) throw new Error('AppContext is not available');

  const { backendUrl } = appContex;
  const { t } = useTranslation();

  const [users, setUsers] = useState<Array<{
    id: number;
    username: string;
    email: string;
    isVerified: boolean;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    Role?: { name: string };
    createdAt: string;
    attachment?: string;
    [key: string]: any;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    id: number;
    username: string;
    email: string;
    isVerified: boolean;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    Role?: { name: string };
    createdAt: string;
    attachment?: string;
    location?: string;
    [key: string]: any;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const detailsModalRef = useRef<HTMLDivElement>(null);
  
  // Pagination
  const itemsPerPage = 5;
  const {
    currentPage,
    totalPages,
    paginatedItems: currentUsers,
    handlePageChange
  } = useSimplePagination(users, itemsPerPage);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/root/users`, {
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
        `${backendUrl}/root/approve-user/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Approval response:', response.data);
      
      setSuccess(t('User Approved Successfully'));
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error approving user:', error);
      if (error.response) {
        console.log('Error response:', error.response.data);
        console.log('Error status:', error.response.status);
      }
      setError(error.response?.data?.message || t('Failed to approve User'));
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
      setError(t('rejection Reason is Required'));
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
        `${backendUrl}/root/reject-user/${selectedUserId}`,
        { rejectionReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Rejection response:', response.data);
      
      setSuccess(t('user Rejected Succesfully'));
      setShowRejectModal(false);
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      if (error.response) {
        console.log('Error response:', error.response.data);
        console.log('Error status:', error.response.status);
      }
      setError(error.response?.data?.message || t('Failed to reject User'));
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
  const approved = users.filter(u => u.status === 'approved').length;
  const pending = users.filter(u => u.status === 'pending').length;
  const rejected = users.filter(u => u.status === 'rejected').length;

  return (
    <div className="p-4 space-y-6">
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <h4 className="font-bold text-gray-700">{t('totalRegistrations')}</h4>
          <CiWallet className="text-gray-700 cursor-pointer" size={20}/>
          <p className="text-3xl font-bold">{total}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
          <h4 className="font-bold text-gray-700">{t('pendingApproval')}</h4>
          <FiAlertTriangle className="text-yellow-500" size={20}/>
          <p className="text-3xl font-bold">{pending}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <h4 className="font-bold text-gray-700">{t('approvedUsers')}</h4>
          <FiCheck className="text-green-500" size={20}/>
          <p className="text-3xl font-bold">{approved}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
          <h4 className="font-bold text-gray-700">{t('rejectedUsers')}</h4>
          <FiX className="text-red-500" size={20}/>
          <p className="text-3xl font-bold">{rejected}</p>
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
          <thead className="bg-[#4d1a57] bg-opacity-100">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('username')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('email')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('role')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('status')}</th>
              <th className="px-6 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider">{t('actions')}</th>
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
                    user.status === 'approved' 
                      ? 'bg-green-100 text-green-700' 
                      : user.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.status === 'approved' ? 'Approved' : user.status === 'rejected' ? 'Rejected' : 'Pending'}
                    {user.status === 'rejected' && user.rejectionReason && (
                      <span className="ml-1" title={user.rejectionReason}></span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                  <button 
                    onClick={() => openDetailsModal(user)} 
                    className="text-blue-600 hover:text-blue-800"
                    title="View Details"
                  >
                    <FiEye size={18} color="#6e2f74" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        {users.length > itemsPerPage && (
          <div className="flex justify-end mt-4 px-6 py-3 border-t border-gray-200">
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div ref={detailsModalRef} className="relative top-20 mx-auto p-0 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white overflow-hidden">
            {/* Header with status indicator */}
            <div className="flex justify-between items-center p-4 border-b bg-[#4d1a57] text-white">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-white">User: {selectedUser.username}</h3>
                <span 
                  className={`ml-3 px-2 py-1 rounded-full text-xs ${
                    selectedUser.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedUser.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {selectedUser.status === 'approved' 
                    ? 'Approved' 
                    : selectedUser.status === 'rejected' 
                      ? 'Rejected' 
                      : 'Pending'}
                </span>
                {selectedUser.rejectionReason && (
                  <div className="ml-3 text-sm text-red-600">
                    <span className="font-medium">
                      {selectedUser.status === 'rejected' ? 'Rejection Reason: ' : 'Previous Rejection: '}
                    </span>
                    {selectedUser.rejectionReason}
                  </div>
                )}
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
                  <h4 className="text-sm font-medium text-gray-500">{t('Username')}</h4>
                  <p className="mt-1 text-gray-900 font-medium">{selectedUser.username}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('Email')}</h4>
                  <p className="mt-1 text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('Role')}</h4>
                  <p className="mt-1 text-gray-900">{selectedUser.Role?.name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('Created At')}</h4>
                  <p className="mt-1 text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                {selectedUser.location && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t('location')}</h4>
                    <p className="mt-1 text-gray-900">{selectedUser.location}</p>
                  </div>
                )}
                {selectedUser.attachment && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">{t('attachment')}</h4>
                    <a
                      href={`${backendUrl}/uploads/${selectedUser.attachment.split(/[\\/]/).pop()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block px-3 py-1 bg-purple-50 text-[#6e2f74] hover:text-[#8a3d91] rounded border border-[#6e2f74] hover:border-[#8a3d91] transition-colors"
                    >
                      {t('viewAttachment')}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Action buttons footer - only shown for pending users */}
              {selectedUser.status === 'pending' && (
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-center items-stretch gap-4 w-full">
                    <Button
                      buttonText={t('approveUser')}
                      buttonColor="#3B0043"
                      buttonStyle={2}
                      textColor="white"
                      iconName="FiCheck"
                      iconSize={18}
                      onClick={() => {
                        handleApprove(selectedUser.id);
                        setShowDetailsModal(false);
                      }}
                      className="w-full sm:w-auto whitespace-nowrap px-4"
                    />
                    
                    <Button
                      buttonText={t('rejectUser')}
                      buttonColor="#5b005b"
                      buttonStyle={1}
                      textColor="#5b005b"
                      iconName="FiX"
                      iconSize={18}
                      onClick={() => {
                        openRejectModal(selectedUser.id);
                        setShowDetailsModal(false);
                      }}
                      className="w-full sm:w-auto whitespace-nowrap px-4"
                    />
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
