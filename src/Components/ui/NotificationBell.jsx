import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Dropdown, Empty, Spin, Tag, Typography } from "antd";
import { LuBell, LuCheck, LuX } from "react-icons/lu";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import api from "../../utils/config";

const BACKEND_URL = import.meta.env.VITE_BASE_URL;

const MAX_NOTIFICATIONS = 50;

const TYPE_COLORS = {
  "ticket:created": "blue",
  "ticket:assigned": "cyan",
  "ticket:escalated": "orange",
  "ticket:resolved": "green",
  "ticket:status_updated": "blue",
  "ticket:new": "purple",
  "requisition:dept_approved": "green",
  "requisition:dept_declined": "red",
  "requisition:itd_approved": "green",
  "requisition:itd_declined": "red",
  "requisition:ready_for_issuance": "cyan",
  "requisition:processed": "green",
  "requisition:pending_stock": "orange",
  "requisition:pending_itd_approval": "purple",
  "stock:low": "volcano",
  "maintenance:created": "red",
  "maintenance:resolved": "green",
  "maintenance:requisition_raised": "orange",
  "maintenance:sla_breached": "red",
  "kb:published": "purple",
};

const TICKET_TYPES = new Set([
  "ticket:created",
  "ticket:assigned",
  "ticket:escalated",
  "ticket:resolved",
  "ticket:status_updated",
  "ticket:new",
  "ticket:work_started",
]);

const getNotificationPath = (type, meta = {}) => {
  if (TICKET_TYPES.has(type) && meta.ticketId) {
    return `/dashboard/service-desk/tickets/${meta.ticketId}`;
  }

  switch (type) {
    case "maintenance:sla_breached":
      return "/dashboard/maintenance";
    case "maintenance:created":
    case "maintenance:resolved":
      return "/dashboard/service-desk";
    case "maintenance:requisition_pending_itd":
      return "/dashboard/itd-approval";
    case "maintenance:requisition_raised":
      return "/dashboard/requisition";
    case "requisition:pending_itd_approval":
      return "/dashboard/itd-approval";
    case "requisition:ready_for_issuance":
      return "/dashboard/stores-officer";
    case "requisition:processed":
      return "/dashboard/acknowledge";
    case "requisition:dept_approved":
    case "requisition:dept_declined":
    case "requisition:itd_approved":
    case "requisition:itd_declined":
    case "requisition:pending_stock":
      return "/dashboard/requisition";
    case "stock:low":
      return "/dashboard/stock";
    case "kb:published":
      return meta.articleId
        ? `/dashboard/knowledge-base?article=${meta.articleId}`
        : "/dashboard/knowledge-base";
    default:
      if (meta.ticketId) return `/dashboard/service-desk/tickets/${meta.ticketId}`;
      if (meta.requisitionId) return "/dashboard/requisition";
      return "/dashboard";
  }
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const fetchedRef = useRef(false);

  // Fetch persisted notifications once on mount
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    api
      .get("/notifications", { params: { take: 30 } })
      .then((res) => {
        const data = res.data?.notifications ?? [];
        setNotifications(
          data.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            meta: n.meta || {},
            time: new Date(n.createdAt),
            read: n.isRead,
          }))
        );
        setUnread(res.data?.unreadCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // WebSocket — connect with JWT
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !BACKEND_URL) return;

    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
    });
    socketRef.current = socket;

    socket.on("notification", (payload) => {
      const notif = {
        id: payload.id ?? `${Date.now()}-${Math.random()}`,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        meta: payload.meta || {},
        time: new Date(payload.createdAt ?? Date.now()),
        read: false,
      };
      setNotifications((prev) =>
        [notif, ...prev].slice(0, MAX_NOTIFICATIONS)
      );
      setUnread((n) => n + 1);
      if (payload.type === "kb:published") {
        toast.info(payload.title || "New knowledge base article published");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleOpenChange = (flag) => {
    setOpen(flag);
  };

  const markOneRead = async (id) => {
    if (!id) {
      toast.error("Unable to mark notification as read");
      return;
    }
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnread((count) => Math.max(0, count - 1));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark notification as read");
    }
  };

  const openNotification = (notification) => {
    if (!notification?.read) {
      markOneRead(notification.id);
    }
    setOpen(false);
    navigate(getNotificationPath(notification.type, notification.meta));
  };

  const markAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark notifications as read");
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    setNotifications([]);
    setUnread(0);
  };

  const items = [
    {
      key: "header",
      label: (
        <div className="flex items-center justify-between gap-2 px-1 py-0.5">
          <Typography.Text strong className="text-sm">
            Notifications
          </Typography.Text>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-[#D32F2F] hover:underline"
              >
                <LuCheck className="text-xs" /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                <LuX className="text-xs" /> Clear
              </button>
            )}
          </div>
        </div>
      ),
    },
    { type: "divider" },
    ...(loading
      ? [
          {
            key: "loading",
            label: (
              <div className="flex justify-center py-4">
                <Spin size="small" />
              </div>
            ),
            disabled: true,
          },
        ]
      : notifications.length === 0
        ? [
            {
              key: "empty",
              label: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No notifications"
                  className="my-2"
                />
              ),
              disabled: true,
            },
          ]
        : notifications.slice(0, 15).map((n) => ({
            key: n.id,
            onClick: () => openNotification(n),
            label: (
              <div
                className={`flex cursor-pointer flex-col gap-0.5 py-1 ${!n.read ? "opacity-100" : "opacity-60"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Tag
                    color={TYPE_COLORS[n.type] ?? "default"}
                    className="text-[10px]"
                  >
                    {n.title}
                  </Tag>
                  {!n.read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D32F2F]" />
                  )}
                </div>
                <span className="text-xs text-gray-700 leading-4">
                  {n.message}
                </span>
                <span className="text-[10px] text-gray-400">
                  {n.time.toLocaleTimeString()}
                </span>
              </div>
            ),
          }))),
  ];

  return (
    <Dropdown
      menu={{ items }}
      trigger={["click"]}
      open={open}
      onOpenChange={handleOpenChange}
      overlayStyle={{ width: 340, maxHeight: 480, overflowY: "auto" }}
    >
      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E0E0E0] bg-white text-[#616161] transition-colors duration-150 hover:border-[#D32F2F]/40 hover:bg-[#FFEBEE] hover:text-[#D32F2F]"
      >
        <Badge count={unread} size="small" offset={[2, -2]}>
          <LuBell className="text-lg" />
        </Badge>
      </button>
    </Dropdown>
  );
}
