/**
 * Shared requisition status colour classes (Tailwind + arbitrary values).
 * Used across Requisition, DeptApproval, ITDApproval, and StatusTable views.
 */
export const REQUISITION_STATUS_STYLES = {
  PENDING_DEPT_APPROVAL: "bg-[#FFF7ED] text-[#C2410C]",
  PENDING_ITD_APPROVAL: "bg-[#FFF7ED] text-[#C2410C]",
  PENDING_STOCK_ISSUANCE: "bg-[#FFF7ED] text-[#9A3412]",
  DEPT_APPROVED: "bg-[#ECFDF3] text-[#166534]",
  ITD_APPROVED: "bg-[#ECFDF3] text-[#166534]",
  PROCESSED: "bg-[#ECFDF3] text-[#166534]",
  DEPT_DECLINED: "bg-[#FFEBEE] text-[#B71C1C]",
  ITD_DECLINED: "bg-[#FFEBEE] text-[#B71C1C]",
  CANCELLED: "bg-[#F5F5F5] text-[#616161]",
};
