import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRazorpay } from "react-razorpay";
import { FaRupeeSign } from "react-icons/fa";
import Topbar from './topbar';

export default function Salary() {
  const [admins, setAdmins] = useState([]);
  const Razorpay = useRazorpay();

  useEffect(() => { fetchAdmins(); }, []);

  async function fetchAdmins() {
    const res = await axios.get('http://localhost:5001/api/salary/');
    const nowMonth = new Date().getMonth();
    setAdmins(res.data.map(admin => ({
      ...admin,
      unpaid: admin.paidForMonth !== nowMonth
    })));
  }

  async function payAdmin(admin) {
    const res = await axios.post(`http://localhost:5001/api/salary/${admin._id}/pay`);
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount: res.data.amount,
      currency: 'INR',
      name: admin.name,
      order_id: res.data.orderId,
      prefill: {
        name: admin.name,
        contact: admin.phone,
        method: 'upi',
        upi: admin.upi
      },
      theme: { color: '#1E3A8A' },
      handler: () => fetchAdmins(),
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen h-[89vh] text-black">
      
      <h2 className="text-3xl font-bold mb-6 text-blue-900">Salary Payments</h2>
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm border border-blue-200 rounded-lg overflow-hidden shadow-md">
          <thead className="bg-blue-900 text-white text-left">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Salary</th>
              <th className="p-4">UPI ID</th>
              <th className="p-4">Status</th>
              <th className="p-4">Pay</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a, idx) => (
              <tr key={a._id} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                <td className="p-4 font-medium text-blue-900">{a.name}</td>
                <td className="p-4">₹{a.salary}</td>
                <td className="p-4">{a.upi}</td>
                <td className={`p-4 font-semibold ${a.unpaid ? "text-red-600" : "text-green-600"}`}>
                  {a.unpaid ? "Unpaid" : "Paid"}
                </td>
                <td className="p-4">
                  {a.unpaid && (
                    <button
                      onClick={() => payAdmin(a)}
                      className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 transition px-4 py-2 text-white rounded shadow"
                    >
                      <FaRupeeSign />
                      Pay Now
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View for Mobile */}
      <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
        {admins.map((a, idx) => (
          <div key={a._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">{a.name}</span>
              <span className={`text-sm font-semibold ${a.unpaid ? "text-red-600" : "text-green-600"}`}>
                {a.unpaid ? "Unpaid" : "Paid"}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Salary: <span className="font-semibold">₹{a.salary}</span></p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">UPI ID: {a.upi}</p>
            <div className="flex justify-end">
              {a.unpaid && (
                <button
                  onClick={() => payAdmin(a)}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 transition px-3 py-1 text-sm text-white rounded shadow"
                >
                  <FaRupeeSign />
                  Pay Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
