import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./NavBar";

const Inventory = () => {
  return (
    <div className="min-h-screen overflow-hidden ">
      <Navbar />
      <Sidebar />
    </div>
  );
};

export default Inventory;
