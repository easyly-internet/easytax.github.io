import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import type { Member } from "../../../../shared/src/types/member";
import mockMembers from "../../../../shared/src/types/mocks/mockMembers";
import {MemberStatus} from "../../../../shared/src/types/member";

// Member Management Component
const MemberManagement = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Member | null; direction: string }>({
    key: null,
    direction: 'ascending',
  });
  const pageSize = 5;

  useEffect(() => {
    // Simulate API call to fetch members
    const fetchMembers = async () => {
      try {
        setLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMembers(mockMembers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching members:', error);
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleViewDetails = (member: Member) => {
    setSelectedMember(member);
    setIsViewDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsViewDetailsOpen(false);
    setSelectedMember(null);
  };

  // Handle sorting
  const requestSort = (key: keyof Member) => {
    setSortConfig((prevState) => ({
      key,
      direction: prevState.key === key && prevState.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  // Apply sorting and filtering
  const getSortedMembers = () => {
    let sortableMembers = [...members];

    // Apply search filtering
    if (searchTerm) {
      sortableMembers = sortableMembers.filter(member =>
        member.panNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key !== null) {
      sortableMembers.sort((a, b) => {
        const key = sortConfig.key as keyof Member;

        if (a[key] === undefined || b[key] === undefined) {
          return 0; // Treat undefined values as equal
        }

        if (a[key] < b[key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableMembers;
  };

  const sortedMembers = getSortedMembers();

  // Pagination
  const pageCount = Math.ceil(sortedMembers.length / pageSize);
  const paginatedMembers = sortedMembers.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, pageCount - 1)));
  };

  const renderStatusBadge = (status : MemberStatus) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    if (status === 'Active') colorClass = 'bg-green-100 text-green-800';
    if (status === 'Inactive') colorClass = 'bg-red-100 text-red-800';
    if (status === 'Pending') colorClass = 'bg-yellow-100 text-yellow-800';

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Member Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage member information
        </p>
      </div>

      {/* Member Actions */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="w-full sm:w-64 mb-4 sm:mb-0">
          <input
            type="text"
            placeholder="Search members..."
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Add New Member
        </button>
      </div>

      {/* Member Table */}
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('panNumber')}
                    >
                      PAN Number
                      {sortConfig.key === 'panNumber' && (
                        <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('fullName')}
                    >
                      Name
                      {sortConfig.key === 'fullName' && (
                        <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('email')}
                    >
                      Email
                      {sortConfig.key === 'email' && (
                        <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('updatedAt')}
                    >
                      Last Updated
                      {sortConfig.key === 'updatedAt' && (
                        <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.panNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(member.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.updatedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.documents?.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(member)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="py-3 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 0 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Previous
          </button>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pageCount - 1}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage >= pageCount - 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{currentPage * pageSize + 1}</span> to <span className="font-medium">{Math.min((currentPage + 1) * pageSize, sortedMembers.length)}</span> of{' '}
              <span className="font-medium">{sortedMembers.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              {Array.from({length: pageCount}, (_, i) => i).map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 border ${currentPage === page ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-sm font-medium`}
                >
                  {page + 1}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= pageCount - 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage >= pageCount - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Member Details Modal */}
      {isViewDetailsOpen && selectedMember && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      Member Details
                    </h3>
                    <div className="mt-2 space-y-4">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm font-medium text-gray-500">PAN Number:</span>
                        <span className="text-sm text-gray-900">{selectedMember.panNumber}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <span className="text-sm text-gray-900">{selectedMember.fullName}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <span className="text-sm text-gray-900">{selectedMember.email}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span>{renderStatusBadge(selectedMember.status)}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                        <span className="text-sm text-gray-900">{selectedMember.updatedAt}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm font-medium text-gray-500">Documents Count:</span>
                        <span className="text-sm text-gray-900">{selectedMember.documents?.length}</span>
                      </div>
                      <div className="border-b pb-2">
                        <span className="text-sm font-medium text-gray-500">Tax Filing Years:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {selectedMember.financialYears?.map((year) => (
                            <span key={year.financialYear} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {year.financialYear}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCloseDetails}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  View Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;