import "./App.css";
import Dashboard from "./Components/Dashboard";

import Login from "./Components/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Requisition from "./Components/Requisition";
import ITDApproval from "./Components/ITDApproval";
import DashboardLayout from "./Components/DashboardLayout";
import DeptApproval from "./Components/DeptApproval";
import StoresOfficer from "./Components/StoresOfficer";
import InvOfficer from "./Components/Inv.Officer";
import StoresPage from "./Components/StoresPage";

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="requisition" element={<Requisition />} />
            <Route path="dpt-approval" element={<DeptApproval />} />
            <Route path="itd-approval" element={<ITDApproval />} />
            <Route path="stores-officer" element={<StoresOfficer />} />
            <Route path="inventory" element={<InvOfficer />} />
            <Route path="stores" element={<StoresPage />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
