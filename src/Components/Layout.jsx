import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./NavBar";

const Layout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div>
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <Navbar onOpenMenu={() => setMobileNavOpen(true)} />
    </div>
  );
};

export default Layout;
