import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Edit2, Search, User, Key, Shield, Check, X, RotateCcw, Plus, ShieldAlert } from 'lucide-react';
import DataTable from '../components/DataTable';
import ModalForm from '../components/ModalForm';
import { productionAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Settings() {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    password: '',
    role: 'USER'
  });

  // User Edit State
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const fetchUsers = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await productionAPI.getSheetData('Login', { headerRow: 1 });
      if (result.success) {
        const mappedUsers = (result.records || []).map(r => ({
          id: (r.username || r.userName || r.__rowValues?.[1] || '').toString().trim(),
          name: (r['full-Name'] || r['Full-Name'] || r.fullName || r.fullname || r.__rowValues?.[0] || '').toString().trim(),
          password: (r.password || r.__rowValues?.[2] || '').toString().trim(),
          role: (r.role || r.__rowValues?.[3] || 'USER').toString().trim(),
          rowIndex: r.rowIndex
        }));
        setUsers(mappedUsers);
      } else {
        toast.error(`Failed to fetch users: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setEditingUser({ ...user });
  };

  const handleSaveUser = async () => {
    if (!editingUser.name.trim() || !editingUser.password.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    const loadToast = toast.loading('Updating user in database...');
    try {
      const rowData = [
        editingUser.name.trim(),
        editingUser.id.trim(),
        editingUser.password.trim(),
        editingUser.role
      ];

      const result = await productionAPI.updateRow('Login', editingUser.rowIndex, rowData);
      if (result.success) {
        toast.success('User updated successfully!', { id: loadToast });
        setEditingUserId(null);
        setEditingUser(null);
        await fetchUsers();
      } else {
        toast.error(`Failed to update user: ${result.error}`, { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating user', { id: loadToast });
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (confirm(`Are you sure you want to delete user "${userToDelete.name}"?`)) {
      const loadToast = toast.loading('Deleting user from database...');
      try {
        const result = await productionAPI.deleteRow('Login', userToDelete.rowIndex);
        if (result.success) {
          toast.success('User deleted!', { id: loadToast });
          await fetchUsers();
        } else {
          toast.error(`Failed to delete user: ${result.error}`, { id: loadToast });
        }
      } catch (err) {
        console.error(err);
        toast.error('Error deleting user', { id: loadToast });
      }
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    if (!newUser.id.trim() || !newUser.name.trim() || !newUser.password.trim()) {
      toast.error('All fields are required!');
      return;
    }

    // Check if ID already exists
    const idExists = users.some(u => u.id.toLowerCase() === newUser.id.trim().toLowerCase());
    if (idExists) {
      toast.error('A user with this User ID already exists!');
      return;
    }

    const loadToast = toast.loading('Adding user to database...');
    try {
      const rowData = [
        newUser.name.trim(),
        newUser.id.trim(),
        newUser.password.trim(),
        newUser.role
      ];

      const result = await productionAPI.insertRow('Login', rowData, { headerRow: 1 });
      if (result.success) {
        toast.success('New user added successfully!', { id: loadToast });
        setNewUser({
          id: '',
          name: '',
          password: '',
          role: 'USER'
        });
        setShowAddUserModal(false);
        await fetchUsers();
      } else {
        toast.error(`Failed to add user: ${result.error}`, { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding user', { id: loadToast });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          user.name.toLowerCase().includes(q) ||
          user.id.toLowerCase().includes(q) ||
          user.role.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Users...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 text-sm">
            Only administrators are allowed to create, update, or delete users from the settings page.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "SN", "Name", "User ID", "Password", "Role", "Actions"
  ];

  const renderRow = (user, idx) => {
    const isEditing = editingUserId === user.id;
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    
    if (isEditing) {
      return (
        <tr key={user.id} className="bg-indigo-50/40 border-b border-gray-100 transition-colors">
          <td className="px-4 py-2.5 text-center text-xs text-gray-700 whitespace-nowrap">{globalIdx}</td>
          <td className="px-4 py-2.5 whitespace-nowrap">
            <div className="relative">
              <User className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 border border-indigo-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[30px] bg-white text-gray-800"
              />
            </div>
          </td>
          <td className="px-4 py-2.5 whitespace-nowrap text-center">
            <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded border border-gray-200 font-mono">
              {editingUser.id}
            </span>
          </td>
          <td className="px-4 py-2.5 whitespace-nowrap">
            <div className="relative">
              <Key className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={editingUser.password}
                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 border border-indigo-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[30px] bg-white text-gray-800"
              />
            </div>
          </td>
          <td className="px-4 py-2.5 whitespace-nowrap">
            <div className="relative">
              <Shield className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                className="w-full pl-8 pr-2 py-1.5 border border-indigo-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[30px] bg-white text-indigo-700 font-bold appearance-none"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </td>
          <td className="px-4 py-2.5 whitespace-nowrap text-center">
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleSaveUser}
                className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition px-2 py-1 rounded text-[11px] font-bold"
              >
                <Check size={12} /> Save
              </button>
              <button
                onClick={() => setEditingUserId(null)}
                className="flex items-center gap-1 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition px-2 py-1 rounded text-[11px]"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">{user.name}</td>
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-mono whitespace-nowrap">{user.id}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-400 whitespace-nowrap">••••••••</td>
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black ${
            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {user.role}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleEditUser(user)}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition text-[11px] font-bold"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              onClick={() => handleDeleteUser(user)}
              className="flex items-center gap-1 text-red-600 hover:text-red-800 transition text-[11px]"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderCard = (user, idx) => {
    const isEditing = editingUserId === user.id;
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;

    if (isEditing) {
      return (
        <div key={user.id} className="bg-indigo-50/20 rounded-xl border border-indigo-200 p-4 space-y-3 shadow-md">
          <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
            <span className="text-[10px] text-indigo-500 uppercase tracking-widest font-bold">Edit User #{globalIdx}</span>
            <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded border border-gray-200 font-mono">
              ID: {editingUser.id}
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-tight block">Name</label>
              <div className="relative">
                <User className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs h-[34px] bg-white text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-tight block">Password</label>
              <div className="relative">
                <Key className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
                <input
                  type="text"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs h-[34px] bg-white text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-tight block">Role</label>
              <div className="relative">
                <Shield className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs h-[34px] bg-white text-indigo-700 font-bold"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveUser}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow"
              >
                <Check size={14} /> Save
              </button>
              <button
                onClick={() => setEditingUserId(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-gray-200"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={user.id} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
              {globalIdx}
            </span>
            <span className="text-xs font-bold text-gray-900 truncate max-w-[130px]">{user.name}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {user.role}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">User ID</span>
            <span className="text-indigo-600 font-mono font-semibold">{user.id}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Password</span>
            <span className="text-gray-400 font-bold">••••••••</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1.5">
          <button
            onClick={() => handleEditUser(user)}
            className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-indigo-100"
          >
            <Edit2 size={12} /> Edit
          </button>
          <button
            onClick={() => handleDeleteUser(user)}
            className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-red-100"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Header toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg lg:rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-indigo-500 text-xs md:text-sm h-[32px] md:h-[38px]"
              />
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center lg:hidden h-[32px] w-[32px] flex-shrink-0 shadow-sm transition"
              title="Add New User"
            >
              <Plus size={16} />
            </button>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
                title="Reset search"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="hidden lg:flex bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg items-center justify-center transition shadow-sm w-[38px] h-[38px] flex-shrink-0"
          title="Add New User"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Main Content Area using DataTable */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedUsers}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="800px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredUsers.length}
        />
      </div>

      {/* Add New User Modal */}
      <ModalForm
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Add New User Account"
        onSubmit={handleAddUserSubmit}
        submitText="Add User"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Full Name *</label>
            <div className="relative">
              <User className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter full name"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[32px] md:h-[36px]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">User ID *</label>
            <div className="relative">
              <User className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={newUser.id}
                onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                placeholder="Enter unique user ID (e.g. jsmith)"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[32px] md:h-[36px]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Password *</label>
            <div className="relative">
              <Key className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter login password"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[32px] md:h-[36px]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Access Role *</label>
            <div className="relative">
              <Shield className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[32px] md:h-[36px]"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
        </div>
      </ModalForm>

    </div>
  );
}
