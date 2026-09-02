import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import PageSkeleton from "./ui/page-skeleton";

const MIN_VISIBLE_MS = 280;

const OutletWithPageSkeleton = () => {
  const location = useLocation();
  const pendingFirstFetches = useIsFetching({
    predicate: (query) =>
      query.state.status === "pending" && query.state.fetchStatus === "fetching",
  });
  const [activePath, setActivePath] = useState(location.pathname);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const shownAtRef = useRef(Date.now());

  if (location.pathname !== activePath) {
    setActivePath(location.pathname);
    setShowSkeleton(true);
    shownAtRef.current = Date.now();
  }

  useEffect(() => {
    if (!showSkeleton) return;
    if (pendingFirstFetches > 0) return;

    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAtRef.current));
    const timer = setTimeout(() => setShowSkeleton(false), wait);
    return () => clearTimeout(timer);
  }, [showSkeleton, pendingFirstFetches, activePath]);

  return (
    <div className="relative min-h-[60vh]">
      <div className={showSkeleton ? "invisible absolute inset-x-0 top-0" : ""}>
        <Outlet />
      </div>
      {showSkeleton ? (
        <div className="relative z-10 bg-[#F7F7F7]">
          <PageSkeleton />
        </div>
      ) : null}
    </div>
  );
};

export default OutletWithPageSkeleton;
