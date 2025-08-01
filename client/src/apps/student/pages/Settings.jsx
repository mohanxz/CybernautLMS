import { useEffect, useState } from "react";
import api from "../api"
import { toast } from "react-toastify";


const SettingsSkeleton = () => (
  <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f0f0', animation: 'pulse 1.5s infinite' }}>
    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
      <div style={{ width: '25%', height: '40px', backgroundColor: '#e0e0e0', marginBottom: '0.5rem' }} />
      <div style={{ width: '50%', height: '20px', backgroundColor: '#e0e0e0', marginBottom: '1.5rem' }} />
      <div style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: 'white' }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e0e0e0' }} />
            <div style={{ marginLeft: '1rem' }}>
              <div style={{ width: '120px', height: '30px', backgroundColor: '#e0e0e0', marginBottom: '0.5rem' }} />
              <div style={{ width: '180px', height: '20px', backgroundColor: '#e0e0e0' }} />
            </div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ width: '50%', height: '48px', backgroundColor: '#e0e0e0' }} />
            <div style={{ width: '50%', height: '48px', backgroundColor: '#e0e0e0' }} />
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div style={{ width: '25%', height: '20px', backgroundColor: '#e0e0e0', marginBottom: '0.5rem' }} />
                <div style={{ height: '40px', backgroundColor: '#e0e0e0' }} />
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ width: '25%', height: '20px', backgroundColor: '#e0e0e0', marginBottom: '0.5rem' }} />
              <div style={{ height: '40px', backgroundColor: '#e0e0e0' }} />
            </div>
          </div>
          <div style={{ width: '120px', height: '40px', backgroundColor: '#e0e0e0', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  </div>
);

const Settings = () => {
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await api.get("/api/settings/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm({
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
          dob: res.data.dob ? res.data.dob.substring(0, 10) : "", // ISO date to yyyy-mm-dd
        });
      } catch (error) {
        toast.error("Failed to fetch profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    await api.put("/api/settings/me", form, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Profile updated successfully!");
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const toggleVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const submitPasswordChange = async () => {
    const token = localStorage.getItem("token");
    try {
      await api.put(
        "/auth/change-password",
        passwordForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-2 text-black dark:text-white">Profile & Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Manage your account settings and preferences
        </p>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center p-6 border-b dark:border-gray-600">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-3xl text-blue-500 font-bold">
              {form.name?.charAt(0)}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-black dark:text-white">{form.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">{form.email}</p>
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                Student
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b dark:border-gray-600">
            <button
              className={`flex-1 py-3 text-center font-semibold ${
                tab === "profile"
                  ? "bg-gray-100 dark:bg-gray-700 border-b-2 border-blue-600"
                  : "bg-white dark:bg-gray-800"
              } text-black dark:text-white`}
              onClick={() => setTab("profile")}
            >
              Profile
            </button>
            <button
              className={`flex-1 py-3 text-center font-semibold ${
                tab === "password"
                  ? "bg-gray-100 dark:bg-gray-700 border-b-2 border-blue-600"
                  : "bg-white dark:bg-gray-800"
              } text-black dark:text-white`}
              onClick={() => setTab("password")}
            >
              Password
            </button>
          </div>

          {/* Profile Tab */}
          {tab === "profile" && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">Full Name</label>
                  <input
                  disabled
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full mt-1 border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">Email Address</label>
                  <input
                    disabled
                    name="email"
                    value={form.email}
                    className="w-full mt-1 border dark:border-gray-600 rounded px-3 py-2 bg-gray-100 dark:bg-gray-600 cursor-not-allowed dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">Phone Number</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full mt-1 border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-black dark:text-white">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    className="w-full mt-1 border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-black dark:text-white">Address</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full mt-1 border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Save Profile
              </button>
            </div>
          )}

          {/* Password Tab */}
          {tab === "password" && (
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-black dark:text-white">Change Password</h2>
              <p className="text-gray-500 dark:text-gray-300">
                Update your password to keep your account secure
              </p>

              {["currentPassword", "newPassword", "confirmPassword"].map(
                (field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-black dark:text-white">
                      {field === "currentPassword"
                        ? "Current Password"
                        : field === "newPassword"
                        ? "New Password"
                        : "Confirm New Password"}
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword[field] ? "text" : "password"}
                        name={field}
                        value={passwordForm[field]}
                        onChange={handlePasswordChange}
                        className="w-full border dark:border-gray-600 px-3 py-2 rounded dark:bg-gray-700 dark:text-white"
                      />
                      <span
                        onClick={() => toggleVisibility(field)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                      >
                        ���
                      </span>
                    </div>
                  </div>
                )
              )}

              <button
                onClick={submitPasswordChange}
                className="mt-4 bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800"
              >
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
