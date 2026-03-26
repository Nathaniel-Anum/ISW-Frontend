import "./App.css";
import { lazy, Suspense, useEffect } from "react";
import { Spin } from "antd";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import ErrorBoundary from "./Components/ErrorBoundary";

// Eagerly load auth/layout shells (tiny, needed immediately)
import Login from "./Components/Login";
import DashboardLayout from "./Components/DashboardLayoutbo";
import DLayout from "./BackOffice/DLayout";

// Lazy-load all route components
const Dashboard = lazy(() => import("./Components/Dashboard"));
const Requisition = lazy(() => import("./Components/Requisition"));
const ITDApproval = lazy(() => import("./Components/ITDApproval"));
const DeptApproval = lazy(() => import("./Components/DeptApproval"));
const StoresOfficer = lazy(() => import("./Components/StoresOfficer"));
const InvOfficer = lazy(() => import("./Components/Inv.Officer"));
const StoresPage = lazy(() => import("./Components/StoresPage"));
const Maintenance = lazy(() => import("./Components/Maintenance"));
const MaintenanceReport = lazy(() => import("./Components/MaintenanceReport"));
const TotalTicket = lazy(() => import("./Components/TotalTicket"));
const Resolved = lazy(() => import("./Components/Resolved"));
const Unresolved = lazy(() => import("./Components/Unresolved"));
const InventoryReport = lazy(() => import("./Components/InventoryReport"));
const TotalAssets = lazy(() => import("./Components/TotalAssets"));
const TotalDevices = lazy(() => import("./Components/TotalDevices"));
const Acknowledge = lazy(() => import("./Components/Acknowledge"));
const StatusTable = lazy(() => import("./Components/StatusTable"));
const StoresReport = lazy(() => import("./Components/StoresReport"));
const ServiceDesk = lazy(() => import("./Components/ServiceDesk"));
const ServiceDeskQueue = lazy(() => import("./Components/ServiceDeskQueue"));
const ServiceDeskTicketDetails = lazy(() => import("./Components/ServiceDeskTicketDetails"));
const ServiceDeskReport = lazy(() => import("./Components/ServiceDeskReport"));
const TechReport = lazy(() => import("./Components/TechReport"));
const InvOfficerReport = lazy(() => import("./Components/InvOfficerReport"));
const TicketsResolved = lazy(() => import("./Components/TicketsResolved"));
const ForgotPassword = lazy(() => import("./Components/ForgotPassword"));
const LoginWithToken = lazy(() => import("./Components/LoginWithToken"));
const ResetPassword = lazy(() => import("./Components/ResetPassword"));
const Stock = lazy(() => import("./Components/Stock"));
const AdminLogs = lazy(() => import("./Components/AdminLogs"));
const UserGuide = lazy(() => import("./Components/UserGuide"));
const PMSchedules = lazy(() => import("./Components/PMSchedules"));
const KnowledgeBase = lazy(() => import("./Components/KnowledgeBase"));

// Back office
const Employees = lazy(() => import("./BackOffice/Employees"));
const Department = lazy(() => import("./BackOffice/Department"));
const Units = lazy(() => import("./BackOffice/Units"));
const Supplier = lazy(() => import("./BackOffice/Supplier"));
const Roles = lazy(() => import("./BackOffice/Roles"));
const ItItems = lazy(() => import("./BackOffice/ItItems"));
const Permissions = lazy(() => import("./BackOffice/Permissions"));
const ServiceDeskCategories = lazy(() => import("./BackOffice/ServiceDeskCategories"));
const SupportProfiles = lazy(() => import("./BackOffice/SupportProfiles"));
const SkillTags = lazy(() => import("./BackOffice/SkillTags"));

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Spin size="large" />
  </div>
);

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const publicPaths = [
    "/",
    "/login-with-token",
    "/forgot-password",
    "/reset-password",
  ];

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const mustResetPassword =
      localStorage.getItem("mustResetPassword") === "true";

    if (!token && !publicPaths.includes(pathname)) {
      console.log(
        `Auth: No token, accessing protected path (${pathname}). Redirecting to /`
      );
      navigate("/", { replace: true });
    } else if (token && !mustResetPassword && publicPaths.includes(pathname)) {
      console.log(
        `Auth: Logged in, no reset needed, on public path (${pathname}). Redirecting to /dashboard`
      );
      navigate("/dashboard", { replace: true });
    } else if (token && mustResetPassword && pathname !== "/reset-password") {
      console.log(
        `Auth: Logged in, reset required, not on reset page (${pathname}). Redirecting to /reset-password`
      );
      navigate("/reset-password", { replace: true });
    } else {
      // console.log(`Auth: No redirect needed for path (${pathname}). Token: ${!!token}, MustReset: ${mustResetPassword}`);
    }
  }, [pathname, navigate]);
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login-with-token" element={<Suspense fallback={<PageLoader />}><LoginWithToken /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>} />
        <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="requisition" element={<Suspense fallback={<PageLoader />}><Requisition /></Suspense>} />
          <Route path="service-desk" element={<Suspense fallback={<PageLoader />}><ServiceDesk /></Suspense>} />
          <Route path="service-desk/tickets/:ticketId" element={<Suspense fallback={<PageLoader />}><ServiceDeskTicketDetails /></Suspense>} />
          <Route path="service-desk-queue" element={<Suspense fallback={<PageLoader />}><ServiceDeskQueue /></Suspense>} />
          <Route path="service-desk-report" element={<Suspense fallback={<PageLoader />}><ServiceDeskReport /></Suspense>} />
          <Route path="dpt-approval" element={<Suspense fallback={<PageLoader />}><DeptApproval /></Suspense>} />
          <Route path="itd-approval" element={<Suspense fallback={<PageLoader />}><ITDApproval /></Suspense>} />
          <Route path="stores-officer" element={<Suspense fallback={<PageLoader />}><StoresOfficer /></Suspense>} />
          <Route path="inventory" element={<Suspense fallback={<PageLoader />}><InvOfficer /></Suspense>} />
          <Route path="stores" element={<Suspense fallback={<PageLoader />}><StoresPage /></Suspense>} />
          <Route path="maintenance" element={<Suspense fallback={<PageLoader />}><Maintenance /></Suspense>} />
          <Route path="maintenance-report" element={<Suspense fallback={<PageLoader />}><MaintenanceReport /></Suspense>} />
          <Route path="stores-report" element={<Suspense fallback={<PageLoader />}><StoresReport /></Suspense>} />
          <Route path="technician-report" element={<Suspense fallback={<PageLoader />}><TechReport /></Suspense>} />
          <Route path="inv-officer-report" element={<Suspense fallback={<PageLoader />}><InvOfficerReport /></Suspense>} />
          <Route path="inventory-report" element={<Suspense fallback={<PageLoader />}><InventoryReport /></Suspense>} />
          <Route path="total-ticket" element={<Suspense fallback={<PageLoader />}><TotalTicket /></Suspense>} />
          <Route path="resolved" element={<Suspense fallback={<PageLoader />}><Resolved /></Suspense>} />
          <Route path="unresolved" element={<Suspense fallback={<PageLoader />}><Unresolved /></Suspense>} />
          <Route path="total-asset" element={<Suspense fallback={<PageLoader />}><TotalAssets /></Suspense>} />
          <Route path="total-devices" element={<Suspense fallback={<PageLoader />}><TotalDevices /></Suspense>} />
          <Route path="acknowledge" element={<Suspense fallback={<PageLoader />}><Acknowledge /></Suspense>} />
          <Route path="status-table" element={<Suspense fallback={<PageLoader />}><StatusTable /></Suspense>} />
          <Route path="resolved-tickets" element={<Suspense fallback={<PageLoader />}><TicketsResolved /></Suspense>} />
          <Route path="stock" element={<Suspense fallback={<PageLoader />}><Stock /></Suspense>} />
          <Route path="admin-logs" element={<Suspense fallback={<PageLoader />}><AdminLogs /></Suspense>} />
          <Route path="user-guide" element={<Suspense fallback={<PageLoader />}><UserGuide /></Suspense>} />
          <Route path="pm-schedules" element={<Suspense fallback={<PageLoader />}><PMSchedules /></Suspense>} />
          <Route path="knowledge-base" element={<Suspense fallback={<PageLoader />}><KnowledgeBase /></Suspense>} />
        </Route>
        <Route path="/backoffice/dashboard" element={<DLayout />}>
          <Route index element={<Suspense fallback={<PageLoader />}><Employees /></Suspense>} />
          <Route path="department" element={<Suspense fallback={<PageLoader />}><Department /></Suspense>} />
          <Route path="service-desk-categories" element={<Suspense fallback={<PageLoader />}><ServiceDeskCategories /></Suspense>} />
          <Route path="support-profiles" element={<Suspense fallback={<PageLoader />}><SupportProfiles /></Suspense>} />
          <Route path="skill-tags" element={<Suspense fallback={<PageLoader />}><SkillTags /></Suspense>} />
          <Route path="unit" element={<Suspense fallback={<PageLoader />}><Units /></Suspense>} />
          <Route path="supplier" element={<Suspense fallback={<PageLoader />}><Supplier /></Suspense>} />
          <Route path="roles" element={<Suspense fallback={<PageLoader />}><Roles /></Suspense>} />
          <Route path="permissions" element={<Suspense fallback={<PageLoader />}><Permissions /></Suspense>} />
          <Route path="it-items" element={<Suspense fallback={<PageLoader />}><ItItems /></Suspense>} />
        </Route>
      </Routes>
    </ErrorBoundary>
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
