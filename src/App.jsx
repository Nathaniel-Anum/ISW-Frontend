import { useEffect } from 'react';
import "./App.css";
import Dashboard from "./Components/Dashboard";
import Inventory from "./Components/Inventory";
import Login from "./Components/Login";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import ForgotPassword from "./Components/ForgotPassword";
import LoginWithToken from "./Components/LoginWithToken";
import ResetPassword from "./Components/ResetPassword";
import NewRequisition from './Components/NewRequisition';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;


  const publicPaths = ['/', '/login-with-token', '/forgot-password', '/reset-password'];

  useEffect(() => {

    const token = localStorage.getItem('access_token');
    const mustResetPassword = localStorage.getItem('mustResetPassword') === 'true';

    if (!token && !publicPaths.includes(pathname)) {
      console.log(`Auth: No token, accessing protected path (${pathname}). Redirecting to /`);
      navigate('/', { replace: true }); 
    }
 
    else if (token && !mustResetPassword && publicPaths.includes(pathname)) {
       console.log(`Auth: Logged in, no reset needed, on public path (${pathname}). Redirecting to /dashboard`);
       navigate('/dashboard', { replace: true }); 
    }

    else if (token && mustResetPassword && pathname !== '/reset-password') {
       console.log(`Auth: Logged in, reset required, not on reset page (${pathname}). Redirecting to /reset-password`);
       navigate('/reset-password', { replace: true }); 
    } else {
       // console.log(`Auth: No redirect needed for path (${pathname}). Token: ${!!token}, MustReset: ${mustResetPassword}`);
    }
  }, [pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login-with-token" element={<LoginWithToken />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/dashboard" element={<Dashboard />}>
        <Route path="requisitions/new" element={<NewRequisition />} />
        {/* nested routes */}
      </Route>

      {/* catch all 404 */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

function App() {
  return (
    <div> 
      <Router>
        <AppContent />
      </Router>
    </div>
  );
}

export default App;