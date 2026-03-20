import React, { useState, useEffect } from 'react';
import api from "../api";
import {
  FaPhone, FaEnvelope, FaChalkboardTeacher, FaEdit, FaTrash,
  FaSearch, FaUserPlus, FaGraduationCap, FaRupeeSign, FaIdCard,
  FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaUserCircle,
  FaFilter, FaSortAmountDown, FaSortAmountUp, FaEye,
  FaMapMarkerAlt, FaCalendarCheck, FaMoneyBillWave, FaUniversity
} from 'react-icons/fa';
import { MdPersonAdd } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GridLoading, CardSkeleton, FadeIn, SlideUp, LoadingSpinner } from "../../../shared/LoadingComponents";

export default function Admins() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSpecialisation, setSelectedSpecialisation] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    salary: '',
    specialisation: [],
    upi: '',
    dob: ''
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await new Promise(resolve => setTimeout(resolve, 600));
        await Promise.all([fetchAdmins(), fetchModules()]);
      } catch (err) {
        setError("Failed to load admin data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/courses/modules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModules(res.data);
    } catch (err) {
      toast.error("Failed to load modules");
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data);
    } catch (err) {
      toast.error("Failed to fetch admins");
    }
  };

  const confirmDelete = (adminId) => {
    setAdminToDelete(adminId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/admins/${adminToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Lecturer deleted successfully");
      setDeleteModalOpen(false);
      setAdminToDelete(null);
      fetchAdmins();
    } catch (err) {
      toast.error("Failed to delete lecturer");
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setAdminToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.specialisation.length === 0) {
      toast.error("Please select at least one specialisation");
      return;
    }
    
    if (!formData.name || !formData.email || !formData.phone || !formData.salary || !formData.upi || !formData.dob) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      salary: formData.salary,
      specialisation: formData.specialisation,
      upi: formData.upi,
      dob: formData.dob
    };

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      if (isEditing) {
        await api.put(`/api/admins/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span>Lecturer updated successfully</span>
          </div>
        );
      } else {
        const res = await api.post('/api/admins', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.generatedPassword) {
          toast.info(
            <div className="space-y-2">
              <div className="font-semibold text-lg">✅ Lecturer Added Successfully!</div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Temporary Password:</p>
                <p className="text-xl font-mono font-bold text-blue-600 bg-white p-2 rounded border border-blue-200 text-center">
                  {res.data.generatedPassword}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <FaEnvelope className="inline mr-1" /> This password has been sent to the lecturer's email
              </p>
            </div>,
            {
              autoClose: 15000,
              closeOnClick: true,
              className: 'bg-white shadow-xl border-l-4 border-blue-500',
            }
          );
        } else {
          toast.success("Lecturer added successfully. Check email for credentials.");
        }
      }

      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        salary: '', 
        specialisation: [], 
        upi: '', 
        dob: '' 
      });
      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      fetchAdmins();
    } catch (err) {
      console.error("Error submitting form:", err);
      const errorMessage = err.response?.data?.error || err.message || "An error occurred";
      toast.error(
        <div className="flex items-center gap-2">
          <FaTimesCircle className="text-red-500" />
          <span>Error: {errorMessage}</span>
        </div>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (admin) => {
    setFormData({
      name: admin.user?.name || '',
      email: admin.user?.email || '',
      phone: admin.phone || '',
      salary: admin.salary || '',
      specialisation: admin.specialisation || [],
      upi: admin.upi || '',
      dob: admin.dob ? admin.dob.split('T')[0] : ''
    });
    setEditingId(admin._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleView = (admin) => {
    setSelectedAdmin(admin);
    setViewModalOpen(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getUniqueSpecialisations = () => {
    const specs = new Set();
    admins.forEach(admin => {
      admin.specialisation?.forEach(spec => specs.add(spec));
    });
    return ['all', ...Array.from(specs)];
  };

  const filteredAndSortedAdmins = () => {
    let filtered = admins.filter(admin =>
      admin.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.phone?.includes(searchTerm) ||
      admin.specialisation?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (selectedSpecialisation !== 'all') {
      filtered = filtered.filter(admin => 
        admin.specialisation?.includes(selectedSpecialisation)
      );
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy === 'name') {
        aVal = a.user?.name || '';
        bVal = b.user?.name || '';
      } else if (sortBy === 'salary') {
        aVal = a.salary || 0;
        bVal = b.salary || 0;
      } else if (sortBy === 'batches') {
        aVal = a.batchCount || 0;
        bVal = b.batchCount || 0;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' 
          ? aVal - bVal
          : bVal - aVal;
      }
    });

    return filtered;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="p-6">
          <FadeIn>
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="h-8 w-48 bg-slate-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-slate-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="h-12 w-36 bg-slate-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-12 bg-slate-200 dark:bg-gray-700 rounded-lg w-full mb-8 animate-pulse"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <GridLoading items={6} CardComponent={CardSkeleton} />
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="p-6">
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Management</h2>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center max-w-2xl mx-auto">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <FaTimesCircle className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-3">Error Loading Admins</h3>
              <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Try Again
              </button>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  const displayedAdmins = filteredAndSortedAdmins();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      <div className="p-6">
        <SlideUp>
          {/* Header Section */}
          <FadeIn delay={100}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Admin Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                  <FaUserCircle className="text-blue-500" />
                  Total {admins.length} administrators • {modules.length} modules available
                </p>
              </div>
              
              <div className="flex gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <MdPersonAdd className="text-lg" />
                  <span className="hidden sm:inline">Add Admin</span>
                </button>
              </div>
            </div>
          </FadeIn>

          {/* Search and Filter Section */}
          <FadeIn delay={200}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 mb-8 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or specialisation..."
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-3">
                  <div className="relative min-w-[180px]">
                    <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                    <select
                      value={selectedSpecialisation}
                      onChange={(e) => setSelectedSpecialisation(e.target.value)}
                      className="w-full pl-10 pr-8 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                    >
                      {getUniqueSpecialisations().map((spec, idx) => (
                        <option key={idx} value={spec}>
                          {spec === 'all' ? 'All Specialisations' : spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative min-w-[140px]">
                    <button
                      onClick={() => handleSort('name')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <span>Sort by Name</span>
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Stats Cards */}
          <FadeIn delay={250}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FaUserCircle className="text-2xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Admins</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{admins.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FaMoneyBillWave className="text-2xl text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Salary</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(admins.reduce((acc, a) => acc + (a.salary || 0), 0) / (admins.length || 1))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FaChalkboardTeacher className="text-2xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Batches</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {admins.reduce((acc, a) => acc + (a.batchCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FaUniversity className="text-2xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Modules</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{modules.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Admins Display */}
          <FadeIn delay={300}>
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedAdmins.map((admin, index) => (
                  <SlideUp key={admin._id} delay={400 + (index * 100)}>
                    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      {/* Card Header with Gradient */}
                      <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-700 relative">
                        <div className="absolute -bottom-12 left-6">
                          <div className="w-20 h-20 rounded-xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border-4 border-white dark:border-gray-800">
                            <span className="text-3xl font-bold text-gray-800 dark:text-white">
                              {admin.user?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="pt-14 p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                              {admin.user?.name}
                            </h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {admin.specialisation?.slice(0, 2).map((spec, i) => (
                                <span key={i} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                                  {spec}
                                </span>
                              ))}
                              {(admin.specialisation?.length || 0) > 2 && (
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                                  +{admin.specialisation.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleView(admin)}
                              className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button 
                              onClick={() => handleEdit(admin)}
                              className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              onClick={() => confirmDelete(admin._id)}
                              className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <FaEnvelope className="flex-shrink-0" />
                              <span className="truncate">{admin.user?.email}</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <FaPhone className="flex-shrink-0" />
                              <span>{admin.phone}</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <FaRupeeSign className="flex-shrink-0" />
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(admin.salary)}
                              </span>
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <FaChalkboardTeacher className="flex-shrink-0" />
                              <span>{admin.batchCount || 0} Batches</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SlideUp>
                ))}
              </div>
            ) : (
              /* List View - Fixed Alignment */
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px] table-fixed">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <tr>
                        <th className="w-[200px] px-6 py-4 text-left text-sm font-semibold">Admin</th>
                        <th className="w-[250px] px-6 py-4 text-left text-sm font-semibold">Contact</th>
                        <th className="w-[250px] px-6 py-4 text-left text-sm font-semibold">Specialisation</th>
                        <th className="w-[150px] px-6 py-4 text-left text-sm font-semibold">Salary</th>
                        <th className="w-[120px] px-6 py-4 text-left text-sm font-semibold">Batches</th>
                        <th className="w-[150px] px-6 py-4 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {displayedAdmins.map((admin, index) => (
                        <SlideUp key={admin._id} delay={400 + (index * 50)}>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                                  {admin.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                                    {admin.user?.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    ID: {admin._id.slice(-6)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 truncate">
                                  <FaEnvelope className="text-xs flex-shrink-0" />
                                  <span className="truncate">{admin.user?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <FaPhone className="text-xs flex-shrink-0" />
                                  <span>{admin.phone}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {admin.specialisation?.map((spec, i) => (
                                  <span key={i} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full whitespace-nowrap">
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                                {formatCurrency(admin.salary)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm whitespace-nowrap">
                                {admin.batchCount || 0} Batches
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleView(admin)}
                                  className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                                <button 
                                  onClick={() => handleEdit(admin)}
                                  className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  onClick={() => confirmDelete(admin._id)}
                                  className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        </SlideUp>
                      ))}
                    </tbody>
                  </table>
                </div>

                {displayedAdmins.length === 0 && (
                  <div className="text-center py-16">
                    <FaUserCircle className="text-6xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No admins found matching your criteria</p>
                  </div>
                )}
              </div>
            )}
          </FadeIn>
        </SlideUp>
      </div>

      {/* Add/Edit Modal - Wider and More Professional */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUp>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    {isEditing ? 'Edit Lecturer' : 'Add New Lecturer'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setIsEditing(false);
                      setEditingId(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        salary: '',
                        specialisation: [],
                        upi: '',
                        dob: ''
                      });
                    }}
                    className="text-white/80 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={isEditing}
                        placeholder="admin@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="10-digit mobile number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        UPI ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.upi}
                        onChange={(e) => setFormData({ ...formData, upi: e.target.value })}
                        required
                        placeholder="admin@okhdfcbank"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monthly Salary (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        required
                        min="0"
                        step="1000"
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Specialisation <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                        {modules.length > 0 ? (
                          modules.map((mod, i) => (
                            <label key={i} className="flex items-center space-x-3 p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.specialisation.includes(mod)}
                                onChange={(e) => {
                                  const newSpecs = e.target.checked
                                    ? [...formData.specialisation, mod]
                                    : formData.specialisation.filter(s => s !== mod);
                                  setFormData({ ...formData, specialisation: newSpecs });
                                }}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-800 dark:text-white">{mod}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-gray-500 col-span-2 text-center py-4">Loading modules...</p>
                        )}
                      </div>
                      {formData.specialisation.length === 0 && (
                        <p className="text-red-500 text-xs mt-2">Please select at least one specialisation</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={isSubmitting || formData.specialisation.length === 0}
                    className={`flex-1 py-3 px-6 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 shadow-lg ${
                      isSubmitting || formData.specialisation.length === 0
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      isEditing ? 'Update Lecturer' : 'Add Lecturer'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setIsEditing(false);
                      setEditingId(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        salary: '',
                        specialisation: [],
                        upi: '',
                        dob: ''
                      });
                    }}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </SlideUp>
        </div>
      )}

      {/* View Details Modal */}
      {viewModalOpen && selectedAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUp>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Admin Details</h3>
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="text-white/80 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold">
                    {selectedAdmin.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAdmin.user?.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">ID: {selectedAdmin._id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <FaEnvelope className="text-blue-500" />
                        {selectedAdmin.user?.email}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <FaPhone className="text-green-500" />
                        {selectedAdmin.phone}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-500" />
                        {formatDate(selectedAdmin.dob)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Salary</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <FaRupeeSign className="text-yellow-500" />
                        {formatCurrency(selectedAdmin.salary)}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">UPI ID</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAdmin.upi || 'Not provided'}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigned Batches</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAdmin.batchCount || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Specialisations</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAdmin.specialisation?.map((spec, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </SlideUp>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUp>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaTrash /> Confirm Deletion
                </h3>
              </div>

              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to delete this lecturer? This action cannot be undone and will also remove their user account.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteConfirmed}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </SlideUp>
        </div>
      )}
    </div>
  );
}