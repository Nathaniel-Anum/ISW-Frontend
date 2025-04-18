import "./App.css";
import Dashboard from "./Components/Dashboard";
import Inventory from "./Components/Inventory";
import Login from "./Components/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Requisition from "./Components/Requisition";
import ITDApproval from "./Components/ITDApproval";
import DashboardLayout from "./Components/DashboardLayout";
function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="requisition" element={<Requisition />} />
            <Route path="itd-approval" element={<ITDApproval />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
