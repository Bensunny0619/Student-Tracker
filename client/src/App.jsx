
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";  
import EditStudent from "./pages/EditStudent";
import LessonHistory from "./pages/LessonHistory";
import LogLesson from "./pages/LogLesson";

import "./App.css";

function HomeRedirect() {
  const { tutor, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Navigate
      to={tutor ? "/dashboard" : "/login"}
      replace
    />
  );
}

function LoginRoute() {
  const { tutor, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return tutor
    ? <Navigate to="/dashboard" replace />
    : <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginRoute />} />

         <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/new" element={<AddStudent />} />
            <Route path="/students/:id/edit" element={<EditStudent />} />
            <Route path="/students/:id/lessons/new" element={<LogLesson />} />  
            <Route path="/students/:id/lessons" element={<LessonHistory />} />   
            <Route
  path="/students/:id/lessons/:lessonId/edit"
  element={<LogLesson />}
/>     
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
