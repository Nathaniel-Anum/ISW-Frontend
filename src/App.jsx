import "./App.css";
import Dashboard from "./Components/Dashboard";

import Login from "./Components/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Requisition from "./Components/Requisition";
import ITDApproval from "./Components/ITDApproval";
import DashboardLayout from "./Components/DashboardLayoutbo";
import DeptApproval from "./Components/DeptApproval";
import StoresOfficer from "./Components/StoresOfficer";
import InvOfficer from "./Components/Inv.Officer";
import StoresPage from "./Components/StoresPage";
import Layout from "./BackOffice/Layout";
import DLayout from "./BackOffice/DLayout";
import Employees from "./BackOffice/Employees";
import Department from "./BackOffice/Department";
import Units from "./BackOffice/Units";
import Supplier from "./BackOffice/Supplier";
import Roles from "./BackOffice/Roles";
import ItItems from "./BackOffice/ItItems";
import Permissions from "./BackOffice/Permissions";
import Maintenance from "./Components/Maintenance";
import MaintenanceReport from "./Components/MaintenanceReport";
import TotalTicket from "./Components/TotalTicket";
import Resolved from "./Components/Resolved";
import Unresolved from "./Components/Unresolved";
import InventoryReport from "./Components/InventoryReport";
import TotalAssets from "./Components/TotalAssets";
import TotalDevices from "./Components/TotalDevices";
import Acknowledge from "./Components/Acknowledge";
import StatusTable from "./Components/StatusTable";
import StoresReport from "./Components/StoresReport";

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
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="maintenance-report" element={<MaintenanceReport />} />
            <Route path="stores-report" element={<StoresReport />} />
            <Route path="inventory-report" element={<InventoryReport />} />
            <Route path="total-ticket" element={<TotalTicket />} />
            <Route path="resolved" element={<Resolved />} />
            <Route path="unresolved" element={<Unresolved />} />
            <Route path="total-asset" element={<TotalAssets />} />
            <Route path="total-devices" element={<TotalDevices />} />
            <Route path="acknowledge" element={<Acknowledge />} />
            <Route path="acknowledge" element={<Acknowledge />} />
            <Route path="status-table" element={<StatusTable />} />
          </Route>
          <Route path="/backoffice/dashboard" element={<DLayout />}>
            <Route index element={<Employees />} />
            <Route path="department" element={<Department />} />
            <Route path="unit" element={<Units />} />
            <Route path="supplier" element={<Supplier />} />
            <Route path="roles" element={<Roles />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="it-items" element={<ItItems />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
