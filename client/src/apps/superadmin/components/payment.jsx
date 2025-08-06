import React, { useEffect, useState } from "react";
import API from "../api";
import paidIcon from "../assets/paid.svg";
import pendingIcon from "../assets/pending.svg";

const PaymentSkeleton = () => (
  <div className="p-2 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:p-4 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 h-30 border border-blue-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      ))}
    </div>
    <div className="flex justify-center mb-6 gap-4">
      <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-full w-32"></div>
      <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-full w-32"></div>
    </div>
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 border dark:border-gray-700">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left text-sm border-separate border-spacing-y-3">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400">
              <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div></th>
              <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div></th>
              <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div></th>
              <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div></th>
              <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div></th>
              <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, i) => (
              <tr key={i} className="bg-white dark:bg-gray-700 shadow-sm rounded-md">
                <td><div className="h-6 bg-gray-300 dark:bg-gray-700 rounded"></div></td>
                <td><div className="h-6 bg-gray-300 dark:bg-gray-700 rounded"></div></td>
                <td><div className="h-6 bg-gray-300 dark:bg-gray-700 rounded"></div></td>
                <td><div className="h-6 bg-gray-300 dark:bg-gray-700 rounded"></div></td>
                <td><div className="h-6 bg-gray-300 dark:bg-gray-700 rounded"></div></td>
                <td><div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-20"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const Payment = () => {
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
  });
  const [view, setView] = useState("salary");
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth();

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const [adminsRes, statsRes] = await Promise.all([
          API.get("/api/salary", { headers: { Authorization: `Bearer ${token}` } }),
          API.get("/api/salary/stats/payments", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setAdmins(adminsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to fetch salary data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalaryData();
  }, []);

  const fetchSalaryData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [adminsRes, statsRes] = await Promise.all([
        API.get("/api/salary", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/api/salary/stats/payments", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setAdmins(adminsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch salary data:", err);
    }
  };

  const fetchTransactions = async (count = 10) => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get(`/api/salary/recent-transactions?count=${count}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.items);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const handleApprovePayment = async (admin) => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.post(`/api/salary/${admin._id}/pay`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { orderId, amount, adminName } = res.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        name: "LMS Salary Payment",
        description: `Salary for ${adminName}`,
        order_id: orderId,
        handler: async function (response) {
          await API.post(`/api/salary/${admin._id}/verify`, {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert("Payment successful");
          window.location.reload();
        },
        prefill: { name: adminName },
        theme: { color: "#1F2937" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment initiation failed");
    }
  };

  if (loading) return <PaymentSkeleton />;

  return (
    <div className="p-2 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:p-4">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 h-30 border border-blue-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Total Revenue</h3>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-2">₹{stats.totalRevenue}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 h-30 border border-blue-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Pending Payments</h3>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-2">{stats.pendingPayments}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 h-30 border border-blue-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Success Rate</h3>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-2">
            {((stats.successfulPayments / (stats.successfulPayments + stats.failedPayments || 1)) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 h-30 border border-blue-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Failed Payments</h3>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-2">{stats.failedPayments}</p>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex justify-center mb-6 gap-4">
        <button
          onClick={() => {
            setView("salary");
            fetchSalaryData();
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            view === "salary"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Monthly Salary Payments
        </button>
        <button
          onClick={() => {
            setView("transactions");
            fetchTransactions();
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            view === "transactions"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Recent Transactions
        </button>
      </div>

      {/* Salary View */}
      {view === "salary" && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 border dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Monthly Salary Payments</h2>
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-sm border-separate border-spacing-y-3">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400">
                  <th>Lecturer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Month</th>
                  <th>Order ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {admins.map((admin, idx) => {
                  const isPaid = admin.paidForMonth === currentMonth;
                  const status = isPaid ? "Paid" : "Pending";
                  return (
                    <tr key={idx} className="bg-white dark:bg-gray-700 shadow-sm rounded-md">
                      <td className="py-3 px-2">{admin.user?.name || "Unnamed"}</td>
                      <td className="py-3 px-2 text-green-600 dark:text-green-400 font-semibold">₹{admin.salary}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                            isPaid
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                          }`}
                        >
                          <img
                            src={isPaid ? paidIcon : pendingIcon}
                            alt={status}
                            className="w-4 h-4"
                          />
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-2">{new Date().toLocaleString('default', { month: 'long' })}</td>
                      <td className="py-3 px-2">{admin.lastOrderId || "—"}</td>
                      <td className="py-3 px-2">
                        {!isPaid && (
                          <button
                            className="bg-black dark:bg-gray-600 text-white px-2 py-1 text-xs rounded hover:bg-gray-800 dark:hover:bg-gray-500"
                            onClick={() => handleApprovePayment(admin)}
                          >
                            Approve
                          </button>
                        )}
                        {isPaid && admin.invoiceId && (
                          <a
                            href={`http://localhost:5001/api/salary/invoice/${admin.invoiceId}`}
                            target="_blank"
                            className="ml-2 text-blue-600 dark:text-blue-400 underline text-xs hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            View Invoice
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Card View for Mobile - Salary */}
          <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
            {admins.map((admin, idx) => {
              const isPaid = admin.paidForMonth === currentMonth;
              const status = isPaid ? "Paid" : "Pending";
              return (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{admin.user?.name || "Unnamed"}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                        isPaid
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                      }`}
                    >
                      <img
                        src={isPaid ? paidIcon : pendingIcon}
                        alt={status}
                        className="w-4 h-4"
                      />
                      {status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Amount: <span className="font-semibold text-green-600 dark:text-green-400">₹{admin.salary}</span></p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Month: {new Date().toLocaleString('default', { month: 'long' })}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Order ID: {admin.lastOrderId || "—"}</p>
                  <div className="flex justify-end gap-2">
                    {!isPaid && (
                      <button
                        className="bg-black dark:bg-gray-600 text-white px-3 py-1 text-sm rounded hover:bg-gray-800 dark:hover:bg-gray-500"
                        onClick={() => handleApprovePayment(admin)}
                      >
                        Approve
                      </button>
                    )}
                    {isPaid && admin.invoiceId && (
                      <a
                        href={`http://localhost:5001/api/salary/invoice/${admin.invoiceId}`}
                        target="_blank"
                        className="text-blue-600 dark:text-blue-400 underline text-sm hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        View Invoice
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions View */}
      {view === "transactions" && (
  <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border dark:border-gray-700">
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>

      <div className="flex flex-col md:flex-row gap-3 items-center">
        <input
          type="text"
          className="border border-gray-300 dark:border-gray-600 px-2 py-1 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Search by ID, method, status"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="border border-gray-300 dark:border-gray-600 px-2 py-1 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          onChange={(e) => fetchTransactions(Number(e.target.value))}
        >
          <option value="5">Last 5</option>
          <option value="10">Last 10</option>
          <option value="50">Last 50</option>
        </select>
      </div>
    </div>

    <table className="w-full text-sm border-separate border-spacing-y-2">
      <thead className="text-gray-500 dark:text-gray-400">
        <tr>
          <th>Transaction ID</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Method</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody className="text-gray-700 dark:text-gray-300">
        {transactions
          .filter(tx =>
            tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tx.method || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.status.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((tx, idx) => (
            <tr key={idx} className="bg-gray-50 dark:bg-gray-700 rounded">
              <td className="py-2 px-2">{tx.id}</td>
              <td className="py-2 px-2">₹{(tx.amount / 100).toFixed(2)}</td>
              <td className="py-2 px-2 capitalize">{tx.status}</td>
              <td className="py-2 px-2">{tx.method || "-"}</td>
              <td className="py-2 px-2">{new Date(tx.created_at * 1000).toLocaleString()}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
)}

    </div>
  );
};

export default Payment;
