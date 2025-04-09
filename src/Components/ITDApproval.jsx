import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../utils/config";

const ITDApproval = () => {
  const { data: approval } = useQuery({
    queryKey: ["approval"],
    queryFn: () => {
      return api.get("/itd/requisitions");
    },
  });

  console.log(approval);
  return (
    <div className="px-[10rem]">
      <p>This is the ITD Approval page.</p>
    </div>
  );
};

export default ITDApproval;
