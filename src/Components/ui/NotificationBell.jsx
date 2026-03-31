import { useEffect, useRef, useState } from "react";
import { Badge, Dropdown, Empty, Spin, Tag, Typography } from "antd";
import { LuBell, LuCheck, LuX } from "react-icons/lu";
import { io } from "socket.io-client";
import api from "../../utils/config";

const BACKEND_URL = import.meta.env.VITE_BASE_URL || "http://localhost:9000";

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
};

export default function NotificationBell() {
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
    if (!token) return;

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
        time: new Date(payload.createdAt ?? Date.now()),
        read: false,
      };
      setNotifications((prev) =>
        [notif, ...prev].slice(0, MAX_NOTIFICATIONS)
      );
      setUnread((n) => n + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleOpenChange = (flag) => {
    setOpen(flag);
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnread((count) => Math.max(0, count - 1));
    } catch {
      /* silent */
    }
  };

  const markAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      /* silent */
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
            label: (
              <div
                className={`flex flex-col gap-0.5 py-1 ${!n.read ? "opacity-100" : "opacity-60"}`}
                onClick={() => { if (!n.read) markOneRead(n.id); }}
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
