import React, { useEffect, useState } from "react";
import API from "../api";
import CourseCard from "./CourseCard";
import { useNavigate } from "react-router-dom";
import FullStack from "../assets/FullStack.webp";
import TechTrio from "../assets/TechTrio.webp";
import DataAnalytics from "../assets/DataAnalytics.webp";

const courseImages = {
  "FullStack.webp": FullStack,
  "TechTrio.webp": TechTrio,
  "DataAnalytics.webp": DataAnalytics
};

export default function AdminHome() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/admin-batches/my-batches");
      setBatches(res.data);
    } catch (err) {
      console.error("Error fetching batches", err);
    }
  };

  const handleCourseClick = (batchId) => {
    navigate(`/admin/batch/${batchId}/lesson-plan`);
  };

  return (
    <div className="w-full max-w-[95%] sm:max-w-[90%] mx-auto pt-6 min-h-[80vh] dark:text-white">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">
        Your Teaching Batches
      </h1>

      {batches.length === 0 ? (
        <p className="text-gray-500 text-base sm:text-lg">
          No courses assigned to you yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-h-[70vh] overflow-y-auto py-4 pr-2">
          {batches.map((batch, idx) => {
            const course = batch.course;
            return (
              <CourseCard 
                key={idx}
                image={courseImages[batch.course.image]}
                name={course?.courseName}
                startDate={batch?.startDate}
                batch={batch?.batchName}
                batchId={batch?._id}
                onClick={() => handleCourseClick(batch?._id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
