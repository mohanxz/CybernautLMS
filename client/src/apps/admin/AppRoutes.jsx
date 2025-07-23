import { useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from "./components/AdminHome";
import ReportPage from "./pages/ReportPage";
import LessonPlan from './pages/LessonPlan';
import AdminChat from './pages/AdminChat';
import StudentList from './pages/studentList';
import SuperAdminChat from './pages/SuperAdminChat';
import { ToastContainer, toast } from 'react-toastify';
import Sidebar from './components/Sidebar';
import Settings from './pages/Settings';
import Quiz from './pages/Quiz';
import AdminCoding from './pages/AdminCoding';
import BatchEvaluation from './pages/BatchEvaluation';
function AppRoutes() {


  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Sidebar>
              <AdminDashboard />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/batches"
          element={
            <PrivateRoute>
              <Sidebar>
              <AdminHome />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/students"
          element={
            <PrivateRoute>
              <Sidebar>
              <StudentList />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/superadmin-chat"
          element={
            <PrivateRoute>
              <Sidebar>
              <SuperAdminChat />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/batch/:batchId/lesson-plan"
          element={
            <PrivateRoute>
              <Sidebar>
              <LessonPlan />
              </Sidebar>
            </PrivateRoute>
          }
        />

          <Route
          path="/batch/:batchId/code"
          element={
            <PrivateRoute>
              <Sidebar>
                <AdminCoding />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/batch/:batchId/batch-evaluation"
          element={
            <PrivateRoute>
              <Sidebar>
                <BatchEvaluation />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/batch/:batchId/quiz"
          element={
            <PrivateRoute>
              <Sidebar>
              <Quiz />
              </Sidebar>
            </PrivateRoute>
          }
        />

        

        <Route
          path="/batch/:batchId/report"
          element={
            <PrivateRoute>
              <Sidebar>
              <ReportPage />
              </Sidebar>
            </PrivateRoute>
          }
        />
        <Route
          path="/batch/:batchId/chat"
          element={
            <PrivateRoute>
              <Sidebar>
              <AdminChat />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Sidebar>
              <Settings />
              </Sidebar>
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default AppRoutes;