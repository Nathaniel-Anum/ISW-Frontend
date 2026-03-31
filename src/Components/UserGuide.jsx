import React, { useState } from "react";
import {
  LuArrowRightLeft,
  LuBadgeCheck,
  LuBell,
  LuBoxes,
  LuBriefcaseBusiness,
  LuCalendarClock,
  LuChevronDown,
  LuChevronRight,
  LuClipboardList,
  LuHeadset,
  LuHardDrive,
  LuHouse,
  LuListChecks,
  LuPackageCheck,
  LuPackagePlus,
  LuQrCode,
  LuScanSearch,
  LuSettings2,
  LuShieldCheck,
  LuSquareActivity,
  LuTimer,
  LuWarehouse,
  LuWrench,
  LuBookOpen,
  LuUserCheck,
  LuPlus,
  LuLock,
} from "react-icons/lu";
import { useUser } from "../utils/userContext";

// ─── Guide data per role ────────────────────────────────────────────────────

const ROLE_GUIDES = {
  user: {
    label: "Staff / Regular User",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    icon: LuHouse,
    intro:
      "As a staff member, you can submit requisition requests for IT items, track their approval status, raise support tickets, and confirm receipt of issued items. The system keeps forms simple — you only fill in what you know, and the stores and support teams handle the rest.",
    sections: [
      {
        title: "Submitting a Requisition",
        icon: LuClipboardList,
        permissions: ["create:requisitions"],
        steps: [
          'Click "Requisitions" in the sidebar.',
          'Press the "+ Create Requisition" button.',
          "Enter the name or description of the item you need (e.g. \"Dell Latitude Laptop\", \"USB-C Hub\") and the quantity required.",
          'Click "Submit".',
          "Your request is sent immediately to your department approver for review. The stores team will record the item category and asset type when they fulfil the request.",
        ],
      },
      {
        title: "Tracking Your Requests",
        icon: LuBadgeCheck,
        permissions: ["read:requisitions"],
        steps: [
          'Open the "Requisitions" page to see all your submitted requests.',
          "Each request shows its current status: Pending Dept Approval, Pending ITD Approval, Approved, Declined, or Processed.",
          'Click the Dashboard home to see a quick count of open and approved requests.',
        ],
      },
      {
        title: "Using the Service Desk",
        icon: LuHeadset,
        permissions: ["create:service_desk", "read:service_desk"],
        steps: [
          'Go to "Service Desk" in the sidebar.',
          'Click "Report Issue".',
          'In the "Report an Issue" form, enter a Subject, select a Priority (defaults to Medium), and describe the problem.',
          "As you type the subject, the system automatically searches the Knowledge Base and shows related articles below the form — check these first as they may resolve your issue without raising a ticket.",
          'Click "Submit Ticket" to create the request.',
          "The service desk attendant will assign the correct category, issue type, and affected asset when they review your ticket.",
          'Use "View" to open ticket details, reply in comments when the team needs more information, and use "Confirm Fixed" when a resolved issue has been verified.',
          'After closure, use "Rate" and "Submit Feedback" if you want to score the support experience.',
        ],
      },
      {
        title: "Knowledge Base",
        icon: LuBookOpen,
        permissions: ["read:knowledge_base"],
        steps: [
          'Open "Knowledge Base" in the sidebar to browse published IT support articles.',
          "Use the search bar to find articles by title, keyword, or tag.",
          "Articles are organised by category — browse or filter to narrow results.",
          "Click any article title to open the full content. View counts show the most-read articles.",
          "If you cannot find a solution, raise a Service Desk ticket for direct support.",
        ],
      },
      {
        title: "Notification Bell",
        icon: LuBell,
        permissions: [],
        steps: [
          "The bell icon in the top-right navbar shows a live badge count of unread notifications.",
          "Click it to open the notification dropdown — updates arrive in real time without refreshing.",
          "Notification types include: ticket status updates, requisition status changes, stock reorder alerts, and new maintenance tickets.",
          "Click \"Clear all\" inside the dropdown to dismiss all notifications.",
        ],
      },
      {
        title: "Confirming Receipt of Items",
        icon: LuPackageCheck,
        permissions: ["update:requisitions"],
        steps: [
          'Navigate to "Confirm Receipt" in the sidebar.',
          "You will see items that the Stores Officer has issued to you.",
          'Click the confirm button next to each item to acknowledge that you have received it.',
          "This closes the issuance record in the system.",
        ],
      },
    ],
  },

  dept_approver: {
    label: "Department Approver",
    color: "#C2410C",
    bg: "#FFF7ED",
    icon: LuShieldCheck,
    intro:
      "As a Department Approver, you review and action requisition requests submitted by staff in your department before they are forwarded to ITD.",
    sections: [
      {
        title: "Reviewing Departmental Requisitions",
        icon: LuClipboardList,
        permissions: ["read:dept_approver", "approve:dept_approver", "decline:dept_approver"],
        steps: [
          'Open "Department Approval" from the sidebar.',
          "You will see all pending requests from your department.",
          "Click the expand icon on any row to see the full details of the request.",
          'Click "Approve" to forward the request to ITD, or "Decline" to reject it.',
          "When declining, you must enter a reason that will be visible to the requester.",
        ],
      },
      {
        title: "Your Own Requisitions",
        icon: LuBadgeCheck,
        permissions: ["create:requisitions", "read:requisitions"],
        steps: [
          'You can also submit your own requests via "Requisitions" in the sidebar.',
          "Your own requests go through the standard approval chain.",
        ],
      },
      {
        title: "Service Desk",
        icon: LuHeadset,
        permissions: ["create:service_desk", "read:service_desk"],
        steps: [
          'Use "Service Desk" to raise or track IT support tickets for yourself.',
        ],
      },
    ],
  },

  itd_approver: {
    label: "ITD Approver",
    color: "#7C3AED",
    bg: "#F5F3FF",
    icon: LuShieldCheck,
    intro:
      "As an ITD Approver, you perform the final review of requisitions that have already been approved by their department heads before they are passed to Stores for issuance.",
    sections: [
      {
        title: "Reviewing ITD Requisitions",
        icon: LuClipboardList,
        permissions: ["read:itd_approver", "approve:itd_approver", "decline:itd_approver"],
        steps: [
          'Open "ITD Approval" from the sidebar.',
          "You will see all requests that have passed departmental approval and are awaiting your decision.",
          "Review the item, quantity, justification, and urgency.",
          'Click "Approve" to authorise issuance, or "Decline" to reject and return to the requester.',
          "Approved standard requisitions are immediately visible to the Stores Officer for stock issuance.",
        ],
      },
      {
        title: "Your Own Requisitions",
        icon: LuBadgeCheck,
        permissions: ["create:requisitions", "read:requisitions"],
        steps: [
          'You can submit your own requests via "Requisitions".',
          "Your own requests follow the same approval workflow.",
        ],
      },
    ],
  },

  stores_officer: {
    label: "Stores Officer",
    color: "#0D9488",
    bg: "#F0FDFA",
    icon: LuWarehouse,
    intro:
      "As a Stores Officer, you manage the receipt of new stock from suppliers, issue approved items to staff, and maintain stock records.",
    sections: [
      {
        title: "Receiving Stock",
        icon: LuPackagePlus,
        permissions: ["create:stores"],
        steps: [
          'Go to "Receive Stock" in the sidebar.',
          'Click "+ Add Stock Received".',
          "Select the supplier, choose the IT item, and enter the quantity received along with the LPO reference and voucher number.",
          'Click "Submit" to record the received batch — this adds to the available stock.',
        ],
      },
      {
        title: "Issuing Items to Staff",
        icon: LuArrowRightLeft,
        permissions: ["update:requisitions"],
        steps: [
          'Go to "Issue Items" in the sidebar.',
          "You will see both ITD-approved standard requisitions and technician-raised maintenance requisitions that are ready for issuance.",
          "Find the request, then select the IT item and the stock batch to issue from. Items matching the requested category appear first; alternatives are listed below.",
          'Click "Issue" to complete the transaction.',
          "The category and asset type (Fixed Asset / Consumable) are automatically recorded on the requisition from the issued IT item — no manual classification needed.",
          "The requesting staff member will be prompted to confirm receipt.",
        ],
      },
      {
        title: "Viewing Stock Levels",
        icon: LuWarehouse,
        permissions: ["read:stock"],
        steps: [
          'Open "Stock" in the sidebar to see current stock levels for all IT items.',
          "Filter by device type, brand, or availability.",
          "Items with low or zero quantity are highlighted for easy identification.",
        ],
      },
      {
        title: "Stores Reports",
        icon: LuScanSearch,
        permissions: ["read:reports"],
        steps: [
          'Go to "Stores Report" to generate detailed reports.',
          "Filter by date range, item, supplier, or requisition status.",
          "Report types include: Stock Received, Stock Issued, and Requisition Status.",
          "Export the current report to Excel when you need an offline copy or submission file.",
        ],
      },
    ],
  },

  inventory_officer: {
    label: "Inventory Officer",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    icon: LuBoxes,
    intro:
      "As an Inventory Officer, you maintain the IT asset register — recording device details, tracking assignment, updating device status, and producing inventory reports.",
    sections: [
      {
        title: "Viewing the Asset Register",
        icon: LuBoxes,
        permissions: ["read:inventory"],
        steps: [
          'Open "Inventory" in the sidebar.',
          "All tracked IT devices are listed with their device type, serial number, assigned user, and status.",
          "Use the search bar to quickly find a specific device.",
        ],
      },
      {
        title: "Updating Device Details",
        icon: LuHardDrive,
        permissions: ["update:inventory"],
        steps: [
          "Click on any device row in the Inventory list.",
          "Update general details such as status, assigned user, department, or room number.",
          'Use the "Device Details" tab to record technical specs such as processor, RAM, and storage.',
          'Click "Save" to confirm changes.',
        ],
      },
      {
        title: "QR Code Labels",
        icon: LuQrCode,
        permissions: ["read:qr_code"],
        steps: [
          "Open the Inventory list and click \"View\" on any asset record.",
          "Inside the asset detail modal, click \"Download QR Code\" to download a PNG label for that device.",
          "Print and attach the QR label to the physical device for fast identification and scanning.",
        ],
      },
      {
        title: "Inventory Reports",
        icon: LuScanSearch,
        permissions: ["read:reports"],
        steps: [
          'Go to "Officer Report" in the sidebar.',
          "Generate reports filtered by device type, status, department, or date range.",
          "Report types include Device Age, Full Device Listing, and Status Summary.",
          "Export the active report view to Excel when you need to share or archive the results.",
        ],
      },
    ],
  },

  hardware_technician: {
    label: "Hardware Technician",
    color: "#C2410C",
    bg: "#FFF7ED",
    icon: LuWrench,
    intro:
      "As a Hardware Technician, you log and manage hardware maintenance jobs, resolve assigned service desk tickets, and produce technician reports.",
    sections: [
      {
        title: "Logging a Maintenance Job",
        icon: LuWrench,
        permissions: ["create:maintenance_tickets"],
        steps: [
          'Open "Maintenance" in the sidebar.',
          'Click "Create Job Card".',
          "Select the affected user, their device, the issue type, and priority.",
          "Describe the fault and assign it to a technician (yourself or a colleague).",
          'Click "Submit" to create the job.',
        ],
      },
      {
        title: "Updating a Job",
        icon: LuBadgeCheck,
        permissions: ["update:maintenance_tickets", "create:requisitions"],
        steps: [
          "Find the job in the Maintenance list.",
          'Click "Edit" on the job row.',
          "Use \"Request Item\" when a repair needs parts or a replacement item from Stores.",
          "Enter the requested item, quantity, urgency, and purpose, then submit the maintenance requisition.",
          "Use the resolve form to capture action taken, return details, and remarks.",
          'Click "Resolve" when the job is complete.',
          "Resolved jobs move to the Resolved Jobs view.",
        ],
      },
      {
        title: "Service Desk Support Queue",
        icon: LuBriefcaseBusiness,
        permissions: ["read:service_desk", "update:service_desk"],
        steps: [
          'Open "Support Queue" in the sidebar.',
          'Use the top filter to switch between "Queue View", "My Tickets", "Unassigned", and "Reported By Me".',
          'Open the options icon on any row to access "View ticket", "Accept" or "Start Work", "Update status", "Escalate", and "Add comment" when available.',
          'Use "Update status" to move a ticket through "Troubleshooting", "In Progress", "Waiting For User", "Resolved", or "Cancelled" based on the workflow.',
          'When resolving a ticket, complete the "Resolution Notes" field before clicking "Update Ticket".',
        ],
      },
      {
        title: "SLA Overdue Badges",
        icon: LuTimer,
        permissions: ["read:maintenance_tickets"],
        steps: [
          "In the Maintenance list, any ticket that has exceeded its SLA resolution time shows an \"Overdue\" badge on the description column.",
          "SLA thresholds are configured per priority level by the Supervisor and apply automatically.",
          "Prioritise jobs with overdue badges to meet service commitments.",
        ],
      },
      {
        title: "Preventive Maintenance Schedules",
        icon: LuCalendarClock,
        permissions: ["read:pm_schedules", "create:pm_schedules", "update:pm_schedules"],
        steps: [
          'Open "PM Schedules" in the sidebar.',
          'Click "+ Create Schedule" to set up a recurring maintenance plan for an asset.',
          "Select the asset, enter the frequency in days, set the first due date, and optionally assign a technician.",
          "Active schedules automatically create maintenance job cards every time the due date arrives.",
          "Use the Pause/Resume button on any schedule to temporarily suspend it without deleting it.",
          "Stats at the top show Total Schedules, Active count, and how many are due within the next 7 days.",
        ],
      },
      {
        title: "Suggested Assignees",
        icon: LuBriefcaseBusiness,
        permissions: ["read:service_desk"],
        steps: [
          "When assigning a service desk ticket, the system can recommend available technicians.",
          "Suggestions are sorted by current open ticket workload — technicians with fewer open tickets appear first.",
          "Only technicians with \"Accepting Tickets\" enabled on their support profile are shown.",
        ],
      },
      {
        title: "Technician Report",
        icon: LuSquareActivity,
        permissions: ["read:reports"],
        steps: [
          'Go to "Technician Report" in the sidebar.',
          "Filter jobs by date range, issue type, priority, or status.",
          "Export data to Excel for review or submission.",
        ],
      },
    ],
  },

  service_desk_manager: {
    label: "Service Desk Manager",
    color: "#0D9488",
    bg: "#F0FDFA",
    icon: LuBriefcaseBusiness,
    intro:
      "As a Service Desk Manager, you oversee incoming support tickets, assign work to technicians, monitor ticket flow, review escalations, and track service desk reporting.",
    sections: [
      {
        title: "Managing the Support Queue",
        icon: LuBriefcaseBusiness,
        permissions: ["read:service_desk", "assign:service_desk", "update:service_desk"],
        steps: [
          'Open "Support Queue" in the sidebar.',
          "You will see all tickets across the system, including unassigned ones.",
          'Use the options icon on a row and choose "Assign" to open the "Assign Ticket" modal, then pick a technician and click "Save Assignment".',
          'From the same row menu, you can also choose "Update status", "Escalate", or "Add comment" as needed.',
          'The manager role does not use the "Accept" or "Start Work" actions for direct ticket handling.',
          "When updating a ticket status, you can also set the Category and Issue Type — fields that the user does not fill in on submission. If the issue type is HARDWARE, an Affected Asset dropdown appears so you can link the specific device belonging to the reporter.",
          "Monitor ticket statuses and escalations to ensure issues do not remain unresolved for too long.",
        ],
      },
      {
        title: "Service Desk Reporting",
        icon: LuSquareActivity,
        permissions: ["read:reports"],
        steps: [
          'Open "Service Desk Report" in the sidebar.',
          "Review workload, active tickets, resolved tickets, and escalated tickets in one view.",
          'Use "Filters" to narrow the report by Status, Priority, Category, or Assigned Technician.',
          'Use "Export Excel" to download the current report view.',
        ],
      },
      {
        title: "SLA Countdown in Queue",
        icon: LuTimer,
        permissions: ["read:service_desk"],
        steps: [
          "The Support Queue table includes an \"SLA\" column showing the time remaining to resolution for each open ticket.",
          "Colour codes: green = plenty of time, yellow = under 24 hours, orange = under 1 hour, red = overdue.",
          "Sort or filter the queue by priority and SLA status to action the most critical tickets first.",
        ],
      },
      {
        title: "Open Jobs Per Technician",
        icon: LuBriefcaseBusiness,
        permissions: ["read:maintenance_tickets"],
        steps: [
          'Open "Maintenance" in the sidebar.',
          "Scroll to the \"Technician Workload\" table at the bottom of the page.",
          "The table shows every hardware technician with their current open job count, resolved count, and average resolution time.",
          "Use this view to identify overloaded technicians and reassign or escalate tickets accordingly.",
          "The table refreshes with live data each time the page loads.",
        ],
      },
      {
        title: "Knowledge Base Management",
        icon: LuBookOpen,
        permissions: ["read:knowledge_base", "create:knowledge_base", "update:knowledge_base"],
        steps: [
          'Open "Knowledge Base" from the sidebar.',
          'Click "+ New Article" to create a support article with a title, body content, category, and tags.',
          "Toggle \"Published\" on to make an article visible to all users; leave it off to keep it as a draft.",
          "Click the eye icon on any row to preview the article. Use the pencil icon to edit it.",
          "Published articles appear in the self-service suggestions shown to users when they type a ticket subject.",
        ],
      },
      {
        title: "Service Desk Categories (Backoffice)",
        icon: LuSettings2,
        permissions: ["read:service_desk_categories", "create:service_desk_categories", "update:service_desk_categories"],
        steps: [
          "Categories, support profiles, and skill tags are managed from the Backoffice admin area.",
          "If you need a new category, updated technician profile, or additional skill tag, contact the system administrator.",
        ],
      },
    ],
  },

  workshop_supervisor: {
    label: "Workshop Supervisor",
    color: "#B45309",
    bg: "#FFFBEB",
    icon: LuWrench,
    intro:
      "As Workshop Supervisor, you manage the maintenance workshop — assigning jobs to technicians, creating job cards, tracking open workload, reviewing MTTR analytics, and managing PM schedules.",
    sections: [
      {
        title: "Viewing the Maintenance Queue",
        icon: LuWrench,
        permissions: ["read:maintenance_tickets"],
        steps: [
          'Open "Maintenance" in the sidebar to see all open maintenance jobs across the workshop.',
          "The queue shows every job card with device details, assigned technician, department, and SLA status.",
          "Use the search bar at the top to filter by user, brand, model, department, or technician.",
          'Click "Details" on any row to see full job information including linked service desk ticket and requisition history.',
        ],
      },
      {
        title: "Assigning Jobs to Technicians",
        icon: LuUserCheck,
        permissions: ["assign:maintenance_tickets"],
        steps: [
          "In the Maintenance queue, click \"Reassign\" on any open job card.",
          "Select the technician from the dropdown and click \"Assign Technician\".",
          "This updates the job's responsible technician immediately and the technician can then work the job.",
          "Note: you can only reassign jobs that are not yet resolved.",
        ],
      },
      {
        title: "Creating Job Cards",
        icon: LuPlus,
        permissions: ["create:maintenance_tickets"],
        steps: [
          'Click "Create Job Card" at the top of the Maintenance page.',
          "Search for the device by brand or model and select it from the results.",
          "Fill in the issue type, description, and select the receiving technician.",
          "Submit the form — the job appears immediately in the open queue.",
        ],
      },
      {
        title: "Open Jobs Per Technician",
        icon: LuBriefcaseBusiness,
        permissions: ["read:maintenance_tickets"],
        steps: [
          "Scroll to the \"Technician Workload\" table at the bottom of the Maintenance page.",
          "The table shows every technician's current open job count, resolved count, and average resolution time.",
          "Use this snapshot to balance workload — reassign jobs from overloaded technicians to those with capacity.",
        ],
      },
      {
        title: "MTTR Analytics",
        icon: LuSquareActivity,
        permissions: ["read:reports"],
        steps: [
          'On the Maintenance page, click "Load Analytics" to open the Mean Time To Repair (MTTR) dashboard.',
          "Set an optional date range and filter by technician, then click \"Filter\".",
          "The Summary tab shows overall MTTR and total resolved tickets.",
          "Switch tabs to break MTTR down by Technician, Issue Type, Device Type, or Monthly Trend.",
          "Use these stats to identify bottlenecks, skill gaps, and recurring fault patterns.",
        ],
      },
      {
        title: "Preventive Maintenance Schedules",
        icon: LuCalendarClock,
        permissions: ["read:pm_schedules", "create:pm_schedules", "update:pm_schedules", "delete:pm_schedules"],
        steps: [
          'Open "PM Schedules" in the sidebar.',
          'Click "+ Create Schedule" to set up a recurring maintenance plan for an asset.',
          "Select the asset, frequency in days, first due date, and optionally assign a technician.",
          "Active schedules automatically create maintenance job cards when the due date arrives.",
          "Use Pause/Resume on any schedule to temporarily suspend it without deleting it.",
        ],
      },
      {
        title: "Workshop Report",
        icon: LuSquareActivity,
        permissions: ["read:reports"],
        steps: [
          'Open "Workshop Report" in the sidebar.',
          "Review resolved, unresolved, and full ticket views for the hardware team.",
          "Filter by date range, issue type, priority, device type, or technician.",
          "Export the selected view to Excel for management reporting.",
        ],
      },
      {
        title: "Support Queue",
        icon: LuBriefcaseBusiness,
        permissions: ["read:service_desk", "update:service_desk"],
        steps: [
          'Open "Support Queue" to see all active service desk tickets.',
          "You can update ticket status, escalate, or add comments on any ticket in the queue.",
          "When a hardware ticket needs workshop intervention, use the \"Open Maintenance Job\" action on the ticket to create a linked maintenance job card.",
        ],
      },
    ],
  },

  supervisor: {
    label: "Supervisor",
    color: "#0369A1",
    bg: "#F0F9FF",
    icon: LuSquareActivity,
    intro:
      "As Supervisor, you have cross-module visibility — monitoring maintenance, stores, inventory, and service desk performance through dedicated report dashboards and configuring SLA thresholds.",
    sections: [
      {
        title: "Maintenance / Workshop Reports",
        icon: LuSquareActivity,
        permissions: ["read:supervisor"],
        steps: [
          'Go to "Maintenance Report" in the sidebar.',
          "Review maintenance totals and drill into resolved, unresolved, or full ticket views.",
          "Use the linked report screens to inspect detailed records and export them to Excel.",
          "The detailed views highlight operational performance and open workload.",
        ],
      },
      {
        title: "Stores Reports",
        icon: LuScanSearch,
        permissions: ["read:supervisor"],
        steps: [
          'Open "Supervisor Stores Report".',
          "Access stock movement, received stock, issued stock, and low-stock alerts.",
          "Filter by date, department, item, or supplier.",
          "Export the selected report to Excel when needed.",
        ],
      },
      {
        title: "Inventory Reports",
        icon: LuHardDrive,
        permissions: ["read:supervisor"],
        steps: [
          'Open "Inventory Report".',
          "Review inventory summary cards and open the detailed inventory report screens as needed.",
          "Use the report views to inspect device status and age details, then export them to Excel.",
        ],
      },
      {
        title: "Support Queue Overview",
        icon: LuBriefcaseBusiness,
        permissions: ["read:service_desk", "update:service_desk"],
        steps: [
          'Open "Support Queue" to monitor all active service desk tickets.',
          'Use the options icon on each ticket row to access the actions available to your role, including "View ticket", "Update status", "Escalate", and "Add comment".',
          "You can monitor ticket flow, update statuses when intervention is needed, and view escalations across the queue.",
          "Primary technician assignment is still managed through the service desk manager workflow.",
        ],
      },
      {
        title: "Service Desk Report",
        icon: LuHeadset,
        permissions: ["read:reports"],
        steps: [
          'Open "Service Desk Report" in the sidebar.',
          "Review ticket workload, resolution progress, and escalated items across the service desk operation.",
          'Use "Filters" to refine the dataset and "Export Excel" to download the current report for management review.',
        ],
      },
      {
        title: "SLA Configuration",
        icon: LuTimer,
        permissions: ["read:supervisor", "update:supervisor", "delete:supervisor"],
        steps: [
          "SLA thresholds are configured per ticket priority (Low, Medium, High, Critical).",
          "These settings are accessible only to supervisors and admins via the Reports section.",
          "Each threshold defines the maximum number of hours a ticket at that priority level should remain open before it is flagged as overdue.",
          "Changes take effect immediately — open tickets are evaluated against the new limits at the next check.",
        ],
      },
      {
        title: "Open Jobs Per Technician",
        icon: LuBriefcaseBusiness,
        permissions: ["read:maintenance_tickets"],
        steps: [
          'Open "Maintenance" in the sidebar.',
          "Scroll to the \"Technician Workload\" table at the bottom of the page.",
          "The table shows every technician's open job count, resolved count, and average resolution time — giving you a live snapshot of team capacity.",
          "Use this alongside the MTTR analytics to identify performance trends and workload imbalances.",
        ],
      },
      {
        title: "MTTR Analytics",
        icon: LuSquareActivity,
        permissions: ["read:reports"],
        steps: [
          'On the Maintenance page, click "Load Analytics" to open the Mean Time To Repair (MTTR) dashboard.',
          "Set an optional date range and filter by technician, then click \"Filter\".",
          "The Summary tab shows overall MTTR and total resolved tickets for the selected period.",
          "Switch tabs to break down MTTR by Technician, Issue Type, Device Type, or Monthly Trend.",
          "Use these stats to identify bottlenecks, skill gaps, and recurring fault patterns across the hardware team.",
        ],
      },
    ],
  },

  admin: {
    label: "System Administrator",
    color: "#D32F2F",
    bg: "#FFEBEE",
    icon: LuSettings2,
    intro:
      "As the System Administrator, you have full access to all modules. You manage users, roles, permissions, departments, IT items, and audit logs through the Backoffice.",
    sections: [
      {
        title: "Accessing the Backoffice",
        icon: LuSettings2,
        permissions: ["read:admin"],
        steps: [
          'Click your avatar in the top-right corner of the navbar and select "Backoffice".',
          "The Backoffice contains: Employees, Departments, Units, Roles, Permissions, IT Items, Suppliers, Service Desk Categories, Support Profiles, and Skill Tags.",
        ],
      },
      {
        title: "Managing Users",
        icon: LuBadgeCheck,
        permissions: ["read:users", "create:users", "update:users", "delete:users"],
        steps: [
          'In the Backoffice, open "Employees".',
          'Click "+ Add Employee" to create a new user, assigning their staff ID, department, unit, and role.',
          "You can edit, deactivate, restore, or permanently delete a user from the same page.",
          "Use the per-user Reset Password button to force a password reset at next login.",
        ],
      },
      {
        title: "Roles & Permissions",
        icon: LuShieldCheck,
        permissions: ["read:roles", "update:roles", "read:permissions", "create:permissions", "update:permissions", "delete:permissions"],
        steps: [
          'Open "Roles" in the Backoffice to view all roles.',
          'Click "Manage Permissions" on a role to assign or remove permissions.',
          'Permissions are resource-based (e.g., "hardware: read, create, update").',
        ],
      },
      {
        title: "Departments & Units",
        icon: LuBriefcaseBusiness,
        permissions: ["read:departments", "create:departments", "delete:departments", "read:units", "create:units", "delete:units"],
        steps: [
          'Create departments and units from the Backoffice "Departments" and "Units" pages.',
          "Assign a department approver to each department so requisitions route correctly.",
        ],
      },
      {
        title: "IT Items & Suppliers",
        icon: LuBoxes,
        permissions: ["read:it_items", "create:it_items", "delete:it_items", "read:suppliers", "create:suppliers", "delete:suppliers"],
        steps: [
          'Add IT item types in "IT Items" — these appear in requisition and stock forms.',
          'Add supplier records in "Suppliers" — these appear when receiving stock.',
        ],
      },
      {
        title: "Audit Logs",
        icon: LuSquareActivity,
        permissions: ["read:audit_logs"],
        steps: [
          'Open "Admin Logs" from the main dashboard sidebar.',
          "The \"Audit Logs\" tab records every system action — logins, approvals, stock movements, and config changes.",
          "Filter by action type, entity, or date range to trace any change in the system.",
        ],
      },
      {
        title: "Email Logs",
        icon: LuBell,
        permissions: ["read:email_logs"],
        steps: [
          'In "Admin Logs", switch to the "Email Logs\" tab.',
          "This table shows all system-generated emails with their delivery status: Queued, Sent, or Failed.",
          "Filter by status to quickly identify failed emails and note any error messages.",
          "The \"Attempts\" column shows how many delivery retries were made for each message.",
        ],
      },
      {
        title: "Operational Reports",
        icon: LuHeadset,
        permissions: ["read:reports"],
        steps: [
          "Admins can access all operational report screens including Service Desk Report, Maintenance Report, Inventory Report, and other exports from the main dashboard.",
          "Use the export controls on report pages to download Excel copies when needed.",
        ],
      },
      {
        title: "Weekly Digest Emails",
        icon: LuSquareActivity,
        permissions: [],
        steps: [
          "Every Monday at 8 AM, the system automatically emails all admins and supervisors a weekly IT Hub digest.",
          "The digest includes: SLA breach count (tickets open longer than 72 hours) and unresolved maintenance ticket count (jobs older than 7 days).",
          "No configuration is needed — all active admin and supervisor accounts receive the digest automatically.",
        ],
      },
    ],
  },
};

// ─── App-wide feature data ───────────────────────────────────────────────────

const APP_FEATURES = [
  {
    module: "Requisitions & Stores",
    icon: LuWarehouse,
    color: "#0D9488",
    bg: "#F0FDFA",
    description:
      "End-to-end IT item request and stock management — from submission through dual approval to confirmed receipt.",
    features: [
      {
        icon: LuClipboardList,
        title: "Requisition Submission",
        desc: "Staff submit IT item requests with only the item description and quantity. Category and asset type are automatically set by the stores team at the point of issuance.",
      },
      {
        icon: LuShieldCheck,
        title: "Dual-Level Approval Workflow",
        desc: "Requests route through a Department Approver then an ITD Approver before any items are issued.",
      },
      {
        icon: LuPackagePlus,
        title: "Stock Receipt from Suppliers",
        desc: "Log incoming stock with LPO references, voucher numbers, and per-batch tracking.",
      },
      {
        icon: LuArrowRightLeft,
        title: "Stock Issuance",
        desc: "Issue approved items to staff or technicians, selecting from available stock batches.",
      },
      {
        icon: LuPackageCheck,
        title: "Receipt Confirmation",
        desc: "Requesting staff confirm receipt of issued items to close the issuance record.",
      },
      {
        icon: LuScanSearch,
        title: "Stores Reports",
        desc: "Detailed reports on stock received, stock issued, and requisition statuses — with Excel export.",
      },
    ],
  },
  {
    module: "Inventory Management",
    icon: LuBoxes,
    color: "#1D4ED8",
    bg: "#EFF6FF",
    description:
      "Complete IT asset register with lifecycle tracking, device assignment, QR code labels, technical specifications, and reporting.",
    features: [
      {
        icon: LuHardDrive,
        title: "Asset Register",
        desc: "Record all IT devices with asset IDs, serial numbers, device types, and purchase information.",
      },
      {
        icon: LuBadgeCheck,
        title: "Device Assignment",
        desc: "Track which user holds each asset along with their department, room, and location.",
      },
      {
        icon: LuSquareActivity,
        title: "Seven Lifecycle States",
        desc: "Full status coverage: Active, Inactive, Non-Functional, Under Repair, Loaned, Obsolete, and Disposed.",
      },
      {
        icon: LuSettings2,
        title: "Technical Specifications",
        desc: "Attach CPU, RAM, storage, operating system, and other hardware details to each device record.",
      },
      {
        icon: LuQrCode,
        title: "QR Code Labels",
        desc: "Download a printable PNG QR code for any asset directly from the inventory view modal for physical labelling.",
      },
      {
        icon: LuScanSearch,
        title: "Inventory Reports",
        desc: "Filterable reports by device type, status, department, and date range — with Excel export.",
      },
    ],
  },
  {
    module: "Maintenance Jobs",
    icon: LuWrench,
    color: "#C2410C",
    bg: "#FFF7ED",
    description:
      "Log, manage, and resolve hardware fault jobs with integrated parts requisitioning, preventive scheduling, SLA tracking, and MTTR analytics.",
    features: [
      {
        icon: LuWrench,
        title: "Job Card Logging",
        desc: "Create maintenance jobs linked to a specific asset, affected user, and assigned technician.",
      },
      {
        icon: LuBriefcaseBusiness,
        title: "Technician Assignment",
        desc: "Assign jobs to hardware technicians and monitor open workload per technician.",
      },
      {
        icon: LuPackagePlus,
        title: "Maintenance Requisitions",
        desc: "Technicians request parts or replacement items from Stores directly within a job.",
      },
      {
        icon: LuBadgeCheck,
        title: "Job Resolution",
        desc: "Capture action taken, replacement item details, and final remarks when closing a job.",
      },
      {
        icon: LuCalendarClock,
        title: "Preventive Maintenance Schedules",
        desc: "Define recurring maintenance plans per asset. Job cards are created automatically when each schedule falls due.",
      },
      {
        icon: LuTimer,
        title: "SLA Tracking & Overdue Badges",
        desc: "Configurable SLA thresholds per priority. Overdue tickets are visually flagged so technicians can prioritise accordingly.",
      },
      {
        icon: LuSquareActivity,
        title: "MTTR Analytics",
        desc: "Mean Time To Repair dashboards broken down by technician, issue type, device type, and monthly trend.",
      },
      {
        icon: LuSquareActivity,
        title: "Maintenance Reports",
        desc: "Filter open and resolved jobs by date range, issue type, priority, and technician — with Excel export.",
      },
    ],
  },
  {
    module: "Service Desk",
    icon: LuHeadset,
    color: "#7C3AED",
    bg: "#F5F3FF",
    description:
      "Full-lifecycle IT support ticketing with queue management, SLA countdown, skill-based routing, a self-service knowledge base, and satisfaction analytics.",
    features: [
      {
        icon: LuHeadset,
        title: "Ticket Submission",
        desc: "Staff report issues with a subject, priority, and description only. The service desk manager assigns the category, issue type, and affected asset when reviewing the ticket.",
      },
      {
        icon: LuBookOpen,
        title: "Knowledge Base Suggestions",
        desc: "As users type a ticket subject, the system suggests matching published KB articles so issues can be self-resolved before submitting a ticket.",
      },
      {
        icon: LuBriefcaseBusiness,
        title: "Queue & Smart Assignment",
        desc: "Managers assign tickets to technicians; suggested assignees are sorted by current open workload for optimal routing.",
      },
      {
        icon: LuTimer,
        title: "SLA Countdown",
        desc: "Each ticket row in the Support Queue shows a live SLA countdown colour-coded from green to red as the deadline approaches.",
      },
      {
        icon: LuArrowRightLeft,
        title: "Multi-Stage Status Workflow",
        desc: "Tickets progress: Open → Troubleshooting → In Progress → Waiting For User → Resolved → Closed.",
      },
      {
        icon: LuShieldCheck,
        title: "Escalation Management",
        desc: "Escalate tickets with a full comment trail and audit record visible to supervisors.",
      },
      {
        icon: LuBadgeCheck,
        title: "Satisfaction Ratings",
        desc: "Users rate support quality after ticket closure to feed into service desk analytics.",
      },
      {
        icon: LuScanSearch,
        title: "Service Desk Reports",
        desc: "Workload summary and resolved/escalated ticket breakdowns for managers and supervisors.",
      },
    ],
  },
  {
    module: "Knowledge Base",
    icon: LuBookOpen,
    color: "#1D4ED8",
    bg: "#EFF6FF",
    description:
      "Self-service support articles authored by managers and admins, surfaced automatically when users raise tickets.",
    features: [
      {
        icon: LuBookOpen,
        title: "Article Authoring",
        desc: "Service desk managers and admins create articles with title, rich body content, category, and searchable tags.",
      },
      {
        icon: LuBadgeCheck,
        title: "Publish / Draft Control",
        desc: "Toggle articles between Draft and Published. Only published articles are visible to general users and suggestion queries.",
      },
      {
        icon: LuScanSearch,
        title: "Full-Text Search",
        desc: "Users search by title, body content, or tag across the entire article library.",
      },
      {
        icon: LuSquareActivity,
        title: "View Count Tracking",
        desc: "Each article view is counted automatically so the most-used content floats to the top.",
      },
      {
        icon: LuHeadset,
        title: "Inline Ticket Suggestions",
        desc: "When a ticket subject is typed, matching published articles appear as suggestions inside the \"Report an Issue\" form.",
      },
    ],
  },
  {
    module: "Back-office & Administration",
    icon: LuSettings2,
    color: "#D32F2F",
    bg: "#FFEBEE",
    description:
      "Full system administration covering users, roles, permissions, catalogues, audit logs, email tracking, and automated weekly reports.",
    features: [
      {
        icon: LuBadgeCheck,
        title: "Employee Management",
        desc: "Create, edit, deactivate, restore, and delete staff accounts with role assignments.",
      },
      {
        icon: LuShieldCheck,
        title: "Roles & Permissions",
        desc: "Define roles and assign granular, resource-based permissions to control module access.",
      },
      {
        icon: LuBriefcaseBusiness,
        title: "Departments & Units",
        desc: "Build the organisational structure and assign department approvers for approval routing.",
      },
      {
        icon: LuBoxes,
        title: "IT Item Catalogue",
        desc: "Maintain item types used across requisitions, stock management, and inventory records.",
      },
      {
        icon: LuWarehouse,
        title: "Supplier Registry",
        desc: "Maintain supplier records referenced when logging received stock batches.",
      },
      {
        icon: LuSquareActivity,
        title: "Audit Logs",
        desc: "Full trace of every system action — logins, approvals, stock movements, and config changes.",
      },
      {
        icon: LuBell,
        title: "Email Delivery Logs",
        desc: "Track every system-generated email with status (Queued / Sent / Failed), attempt count, and error messages — from Admin Logs → Email Logs tab.",
      },
      {
        icon: LuSquareActivity,
        title: "Weekly Digest Reports",
        desc: "Automated Monday morning digest emailed to all admins and supervisors summarising SLA breaches and unresolved maintenance ticket counts.",
      },
    ],
  },
  {
    module: "Real-Time Notifications",
    icon: LuBell,
    color: "#0D9488",
    bg: "#F0FDFA",
    description:
      "Live WebSocket-powered notification system delivering instant updates to all connected users without page refreshes.",
    features: [
      {
        icon: LuBell,
        title: "Notification Bell",
        desc: "A badge-equipped bell icon in the navbar shows unread notification count in real time.",
      },
      {
        icon: LuHeadset,
        title: "Ticket Status Updates",
        desc: "Users and technicians are notified instantly when a service desk ticket status changes.",
      },
      {
        icon: LuClipboardList,
        title: "Requisition Updates",
        desc: "Staff receive live notifications when their requisition is approved, declined, or issued.",
      },
      {
        icon: LuWarehouse,
        title: "Stock Reorder Alerts",
        desc: "Stores officers see a live alert when any IT item stock falls below the reorder threshold.",
      },
      {
        icon: LuWrench,
        title: "New Maintenance Tickets",
        desc: "Technicians are notified in real time when a new maintenance job is created.",
      },
    ],
  },
];

// ─── Step accordion ─────────────────────────────────────────────────────────

const GuideSection = ({ section, accentColor, bgColor }) => {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E0E0E0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-150 hover:bg-[#F8FAFC]"
      >
        <div className="flex items-center gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: bgColor, color: accentColor }}
          >
            <Icon />
          </span>
          <span className="text-base font-bold text-[#212121]">{section.title}</span>
        </div>
        {open ? (
          <LuChevronDown className="shrink-0 text-[#616161]" />
        ) : (
          <LuChevronRight className="shrink-0 text-[#616161]" />
        )}
      </button>

      {open && (
        <div className="border-t border-[#F1F1F1] px-6 pb-5 pt-4">
          {section.permissions?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {section.permissions.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold"
                  style={{
                    borderColor: accentColor + "33",
                    backgroundColor: accentColor + "10",
                    color: accentColor,
                  }}
                >
                  <LuLock className="text-[10px]" />
                  {p}
                </span>
              ))}
            </div>
          )}
          <ol className="space-y-3">
            {section.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: bgColor, color: accentColor }}
                >
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-6 text-[#424242]">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

// ─── Role card ───────────────────────────────────────────────────────────────

const RoleGuide = ({ guide, accentColor, bgColor }) => {
  const Icon = guide.icon;

  return (
    <div className="space-y-4">
      <div
        className="flex items-start gap-5 rounded-[20px] px-6 py-5"
        style={{ backgroundColor: bgColor }}
      >
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-2xl"
          style={{ borderColor: accentColor + "33", backgroundColor: accentColor + "18", color: accentColor }}
        >
          <Icon />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
            Role Guide
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#212121]">{guide.label}</h2>
          <p className="mt-2 text-sm leading-6 text-[#424242]">{guide.intro}</p>
        </div>
      </div>

      {guide.sections.map((section) => (
        <GuideSection
          key={section.title}
          section={section}
          accentColor={accentColor}
          bgColor={bgColor}
        />
      ))}
    </div>
  );
};

// ─── Feature components ──────────────────────────────────────────────────────

const FeatureItem = ({ feature, accentColor, bgColor }) => {
  const Icon = feature.icon;
  return (
    <div className="flex gap-3">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm"
        style={{ backgroundColor: bgColor, color: accentColor }}
      >
        <Icon />
      </span>
      <div>
        <p className="text-sm font-semibold text-[#212121]">{feature.title}</p>
        <p className="mt-0.5 text-sm leading-5 text-[#757575]">{feature.desc}</p>
      </div>
    </div>
  );
};

const ModuleFeatureCard = ({ module: mod }) => {
  const Icon = mod.icon;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E0E0E0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
      <div className="px-6 py-5" style={{ backgroundColor: mod.bg }}>
        <div className="flex items-center gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{
              backgroundColor: mod.color + "18",
              color: mod.color,
              border: `1px solid ${mod.color}33`,
            }}
          >
            <Icon />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#212121]">{mod.module}</h3>
            <p className="mt-0.5 text-xs leading-5 text-[#616161]">{mod.description}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-[#F5F5F5] px-6 py-1">
        {mod.features.map((f, i) => (
          <div key={i} className="py-4">
            <FeatureItem feature={f} accentColor={mod.color} bgColor={mod.bg} />
          </div>
        ))}
      </div>
    </div>
  );
};

const FeaturesView = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {APP_FEATURES.map((m) => (
        <ModuleFeatureCard key={m.module} module={m} />
      ))}
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const UserGuide = () => {
  const { user } = useUser();
  const userRoles = user?.roles || [];

  // Build the ordered list of guides to show, starting with the user's own roles
  const ROLE_ORDER = [
    "admin",
    "supervisor",
    "workshop_supervisor",
    "service_desk_manager",
    "hardware_technician",
    "inventory_officer",
    "stores_officer",
    "itd_approver",
    "dept_approver",
    "user",
  ];

  const myRoles = ROLE_ORDER.filter((r) => userRoles.includes(r));
  const otherRoles = ROLE_ORDER.filter((r) => !userRoles.includes(r));

  const [activeRole, setActiveRole] = useState(myRoles[0] || ROLE_ORDER[0]);
  const [view, setView] = useState("guide");

  const guide = ROLE_GUIDES[activeRole];

  const RoleTab = ({ roleKey, mine }) => {
    const g = ROLE_GUIDES[roleKey];
    if (!g) return null;
    const isActive = activeRole === roleKey;
    return (
      <button
        type="button"
        onClick={() => setActiveRole(roleKey)}
        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-150 ${
          isActive
            ? "border-[#D32F2F]/30 bg-[#FFEBEE] text-[#D32F2F]"
            : "border-transparent text-[#616161] hover:bg-[#F8FAFC]"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${
            isActive ? "bg-[#D32F2F]/10 text-[#D32F2F]" : "bg-[#F1F1F1] text-[#616161]"
          }`}
        >
          {React.createElement(g.icon)}
        </span>
        <div className="min-w-0">
          <p className={`truncate text-sm font-semibold ${isActive ? "text-[#D32F2F]" : "text-[#212121]"}`}>
            {g.label}
          </p>
          {mine && (
            <p className="text-xs font-medium text-[#16A34A]">Your role</p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 xl:px-10">
      {/* Header */}
      <section className="rounded-[28px] bg-gradient-to-r from-[#1E1E1E] via-[#2A2A2A] to-[#292929] px-6 py-7 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] md:px-8">
        <div className="flex items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <LuBookOpen className="text-3xl" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
              Help & Documentation
            </p>
            <h2 className="mt-1 text-3xl font-bold leading-tight">User Guide</h2>
            <p className="mt-1 text-sm text-slate-300">
              Step-by-step instructions for every role in the system.
            </p>
          </div>
        </div>
      </section>

      {/* View toggle */}
      <div className="mt-6 flex w-fit gap-1 rounded-2xl border border-[#E0E0E0] bg-white p-1 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
        {[
          { key: "guide", label: "Role Guides", icon: LuBookOpen },
          { key: "features", label: "App Features", icon: LuListChecks },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 ${
              view === key
                ? "bg-[#1E1E1E] text-white shadow-md"
                : "text-[#616161] hover:text-[#212121]"
            }`}
          >
            <Icon className="text-base" />
            {label}
          </button>
        ))}
      </div>

      {view === "features" && (
        <div className="mt-8">
          <FeaturesView />
        </div>
      )}

      {view === "guide" && (
      <div className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-start">
        {/* Role selector sidebar */}
        <aside className="shrink-0 xl:w-[260px]">
          <div className="rounded-3xl border border-[#E0E0E0] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            {myRoles.length > 0 && (
              <>
                <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#616161]">
                  My Roles
                </p>
                <div className="space-y-1">
                  {myRoles.map((r) => (
                    <RoleTab key={r} roleKey={r} mine />
                  ))}
                </div>
              </>
            )}

            {otherRoles.length > 0 && (
              <>
                <p className="mb-2 mt-4 px-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#616161]">
                  All Roles
                </p>
                <div className="space-y-1">
                  {otherRoles.map((r) => (
                    <RoleTab key={r} roleKey={r} mine={false} />
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Guide content */}
        <div className="min-w-0 flex-1">
          {guide && (
            <RoleGuide
              guide={guide}
              accentColor={guide.color}
              bgColor={guide.bg}
            />
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default UserGuide;
