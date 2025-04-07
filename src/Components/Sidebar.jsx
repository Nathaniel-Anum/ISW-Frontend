import { Link } from "react-router-dom";
import { LuGitPullRequestCreate } from "react-icons/lu";
import { MdOutlineInventory2 } from "react-icons/md";
import { FaHome } from "react-icons/fa";

const Sidebar = () => {
  return (
    <div>
      <div className="w-full h-full bg-center scrollbar-hidden">
        <div className="w-[140px] h-screen fixed top-0 left-0 px-[15px] py-[19px] bg-[#E3E5E6] overflow-y-auto no-scrollbar">
          <div>
            <img src="/src/assets/logo.9a18109e1c16584832d5.png" alt="" />
          </div>
          <ul className="list-none  px-[15px] py-[25px]  flex flex-col gap-[35px]  my-[20px] cursor-pointer ">
            <Link to="/dashboard">
              <li className="flex flex-col justify-center items-center gap-1 hover:bg-white/10  duration-300 py-2 px-2 hover:scale-105 hover:rounded-md">
                <FaHome className="text-[3rem] text-black" />
                <p className="text-black">Home</p>
              </li>
            </Link>
            <Link to="requisitions/new">
              <li className="flex flex-col justify-center items-center gap-1 hover:bg-white/10  duration-500 py-2 px-2 hover:scale-105 hover:rounded-md ">
                <LuGitPullRequestCreate className=" text-[3rem] w-[43px] text-black" />
                <p className="text-black">Requisition</p>
              </li>
            </Link>
            <Link to="/locator">
              <li className="flex flex-col justify-center items-center gap-1 hover:bg-white/10  duration-500 py-2 px-2 hover:scale-105 hover:rounded-md ">
                <MdOutlineInventory2 className=" text-[3rem] w-[43px] text-black" />
                <p className="text-black">Inventory</p>
              </li>
            </Link>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
