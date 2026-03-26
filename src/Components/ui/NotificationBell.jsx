import { useEffect, useRef, useState } from "react";
import { Badge, Dropdown, Empty, Tag, Typography } from "antd";
import { LuBell, LuX } from "react-icons/lu";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

const MAX_NOTIFICATIONS = 50;

const typeColors = {
  "ticket:update": "blue",
  "requisition:update": "green",
  "stock:reorder": "orange",
  "maintenance:created": "red",
};

const typeLabels = {
  "ticket:update": "Ticket",
  "requisition:update": "Requisition",
  "stock:reorder": "Stock Reorder",
  "maintenance:created": "Maintenance",
};

function formatMessage(type, payload) {
  if (type === "ticket:update")
    return `Ticket #${payload.ticketId} status → ${payload.status}`;
  if (type === "requisition:update")
    return `Requisition #${payload.requisitionId} status → ${payload.status}`;
  if (type === "stock:reorder")
    return `Low stock alert: item ${payload.itItemId} (qty: ${payload.currentQty}, threshold: ${payload.threshold})`;
  if (type === "maintenance:created")
    return `New maintenance ticket #${payload.ticketId} for asset ${payload.assetId}`;
  return JSON.stringify(payload);
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    const addNotif = (type) => (payload) => {
      const notif = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        payload,
        message: formatMessage(type, payload),
        time: new Date(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));
      setUnread((n) => n + 1);
    };

    socket.on("ticket:update", addNotif("ticket:update"));
    socket.on("requisition:update", addNotif("requisition:update"));
    socket.on("stock:reorder", addNotif("stock:reorder"));
    socket.on("maintenance:created", addNotif("maintenance:created"));

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleOpenChange = (flag) => {
    setOpen(flag);
    if (flag) setUnread(0);
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
        <div className="flex items-center justify-between gap-4 px-1">
          <Typography.Text strong>Notifications</Typography.Text>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
            >
              <LuX className="text-xs" /> Clear all
            </button>
          )}
        </div>
      ),
    },
    { type: "divider" },
    ...(notifications.length === 0
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
      : notifications.slice(0, 10).map((n) => ({
          key: n.id,
          label: (
            <div className="flex flex-col gap-0.5 py-0.5">
              <div className="flex items-center gap-2">
                <Tag color={typeColors[n.type]} className="text-[10px]">
                  {typeLabels[n.type]}
                </Tag>
                <span className="text-[11px] text-gray-400">
                  {n.time.toLocaleTimeString()}
                </span>
              </div>
              <span className="text-xs text-gray-700">{n.message}</span>
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
      overlayStyle={{ width: 320 }}
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
