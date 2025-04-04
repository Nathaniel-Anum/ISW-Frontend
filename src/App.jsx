import "./App.css";
import Dashboard from "./Components/Dashboard";
import Inventory from "./Components/Inventory";
import Login from "./Components/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Requisition from "./Components/Requisition";
import ForgotPassword from "./Components/ForgotPassword";
function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />}>
          {/* nested routes */}
            <Route path="requisition" element={<Requisition />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
