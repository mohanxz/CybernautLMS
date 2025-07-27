import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from 'axios';

export default function CourseCard({ image, name, startDate, batch, batchId, onClick }) {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const token = localStorage.getItem("token");

  const date = new Date(startDate);
  const year = date.getFullYear();
  const month = date.toLocaleString("default", { month: "long" });

  useEffect(() => {
    // check if batch is already completed for current admin
    const checkCompletionStatus = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5002/api/admin-batches/check-complete/${batchId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAlreadyCompleted(res.data.isCompleted);
      } catch (err) {
        console.error(err);
        toast.error("Error checking completion status.");
      }
    };

    checkCompletionStatus();
  }, [batchId, token]);

  const handleMarkComplete = async () => {
    try {
      const res = await axios.patch(
        `http://localhost:5002/api/admin-batches/mark-complete/${batchId}`,
        {isCompleted: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Marked "${name}" as completed.`);
      setShowModal(false);
      setConfirmText("");
      setAlreadyCompleted(true); // update local state
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while marking as completed.");
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white rounded-2xl shadow-md overflow-hidden w-80 relative transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      >
        <img src={image} alt={name} className="w-full h-48 object-cover" />

        <div className="p-4 space-y-2">
          <div className="flex justify-between text-gray-600">
            <h2 className="text-xl font-semibold text-gray-800">{name}</h2>
            <span>{year}</span>
          </div>

          <div className="flex justify-between text-gray-600">
            <span>{month}</span>
            <span>Batch: {batch}</span>
          </div>

          {alreadyCompleted ? (
            <div className="mt-2 px-3 py-1 text-sm bg-green-200 text-green-800 rounded text-center font-medium">
              Course Completed
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="mt-2 px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800"
            >
              Mark As Completed
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Confirm Completion</h2>
            <p className="text-sm text-gray-700">
              Type <strong>confirm</strong> to mark <span className="font-medium">{name}</span> as completed.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="Type here..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmText.toLowerCase() === "confirm") {
                    handleMarkComplete();
                  } else {
                    toast.error("Please type 'confirm' to proceed.");
                  }
                }}
                className="px-4 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
