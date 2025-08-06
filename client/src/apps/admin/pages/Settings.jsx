import { useEffect, useState } from "react";
import axios from "axios";
import API from "../api"; // Adjust the import based on your API setup
import { toast } from "react-toastify";

const Settings = () => {
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    specialisation: [],
  });
  const [newSkill, setNewSkill] = useState("");

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
        const token = localStorage.getItem("token");
        const res = await API.get("/api/settings/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm(res.data);
      } catch (err) {
        toast.error("Failed to fetch profile");
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.put("/api/settings/me", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to save profile");
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/api/settings/add-skill",
        { skill: newSkill.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setForm((prev) => ({
        ...prev,
        specialisation: res.data.specialisation,
      }));
      setNewSkill("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add skill");
    }
  };

  const handlePasswordChange = (e) =>
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const toggleVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const submitPasswordChange = async () => {
    const { newPassword, confirmPassword } = passwordForm;

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_LOGIN_API}/auth/change-password`,
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

  return (
    <div className="p-4 flex h-full min-h-screen bg-gray-50 text-black dark:bg-gray-900 dark:text-white">
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Profile & Settings</h1>
        <p className="text-gray-500 mb-6 dark:text-gray-400">
          Manage your account settings and preferences
        </p>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center p-6 border-b dark:border-gray-600 gap-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-3xl text-blue-500 font-bold">
              {form.name?.charAt(0)}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-semibold">{form.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">{form.email}</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Lecturer
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b dark:border-gray-600">
            {['profile', 'password'].map((key) => (
              <button
                key={key}
                className={`flex-1 py-3 text-center font-semibold transition-colors duration-200 ${
                  tab === key
                    ? 'bg-gray-100 dark:bg-gray-700 border-b-2 border-blue-600'
                    : 'bg-white dark:bg-gray-800'
                }`}
                onClick={() => setTab(key)}
              >
                {key === 'profile' ? 'Profile' : 'Password'}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {tab === "profile" && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['name', 'email', 'phone', 'department'].map((field) => (
                  <div key={field}>
                    <label className="text-sm font-medium capitalize">
                      {field.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      name={field}
                      value={form[field]}
                      onChange={handleChange}
                      disabled={field === 'email'}
                      className={`w-full mt-1 border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 ${
                        field === 'email' ? 'bg-gray-100 cursor-not-allowed dark:bg-gray-600' : ''
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium">Skills</label>
                <div className="flex flex-wrap mt-2 gap-2">
                  {form.specialisation?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full dark:bg-blue-900 dark:text-white"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row mt-4 gap-2">
                  <input
                    type="text"
                    className="border rounded px-3 py-2 flex-1 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Add new skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                  />
                  <button
                    onClick={addSkill}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
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
              <h2 className="text-xl font-bold">Change Password</h2>
              <p className="text-gray-500 dark:text-gray-300">
                Update your password to keep your account secure
              </p>

              {Object.keys(passwordForm).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium">
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
                      className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span
                      onClick={() => toggleVisibility(field)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                    >
                      👁
                    </span>
                  </div>
                </div>
              ))}

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
