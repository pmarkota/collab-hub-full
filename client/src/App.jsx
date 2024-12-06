import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./components/layout/MainLayout";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import TeamList from "./components/teams/TeamList";
import TeamDetailsPage from "./pages/TeamDetailsPage";
import PrivateRoute from "./components/PrivateRoute";
import { getToken } from "./utils/auth";
import { initializeSocket, disconnectSocket } from "./utils/socket";

const App = () => {
  useEffect(() => {
    const token = getToken();
    if (token) {
      const socket = initializeSocket();
      if (socket) {
        console.log("[App] Socket initialized:", socket.id);
      }
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1E293B",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/teams" element={<TeamList />} />
                  <Route path="/teams/:teamId" element={<TeamDetailsPage />} />
                </Routes>
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
