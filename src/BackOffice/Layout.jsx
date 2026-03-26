import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <Navbar onOpenMenu={() => setMobileNavOpen(true)} />
    </>
  );
};

export default Layout;