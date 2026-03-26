import React from "react";
import {
  LuBadgeCheck,
  LuBuilding2,
  LuCalendarDays,
  LuEye,
  LuFilePenLine,
  LuFileStack,
  LuGlobe,
  LuMail,
  LuMapPinned,
  LuSettings2,
  LuShield,
  LuShieldCheck,
  LuSignature,
  LuTrash2,
  LuUsers,
  LuWorkflow,
  LuX,
} from "react-icons/lu";

const mergeClassNames = (...classNames) =>
  classNames.filter(Boolean).join(" ");

const BaseIcon = ({
  icon: Icon,
  className,
  color,
  size = 22,
  strokeWidth,
  ...props
}) => (
  <Icon
    size={size}
    color={color}
    strokeWidth={strokeWidth}
    className={mergeClassNames(
      "transition-all duration-200 ease-out",
      className
    )}
    {...props}
  />
);

export const Users = (props) => (
  <BaseIcon icon={LuUsers} className="text-current" {...props} />
);

export const Division = (props) => (
  <BaseIcon icon={LuBuilding2} className="text-current" {...props} />
);

export const Department = (props) => (
  <BaseIcon icon={LuFileStack} className="text-current" {...props} />
);

export const Regions = (props) => (
  <BaseIcon icon={LuGlobe} className="text-current" {...props} />
);

export const Districts = (props) => (
  <BaseIcon icon={LuMapPinned} className="text-current" {...props} />
);

export const Employees = (props) => (
  <BaseIcon icon={LuUsers} className="text-current" {...props} />
);

export const Roles = (props) => (
  <BaseIcon icon={LuBadgeCheck} className="text-current" {...props} />
);

export const Delete = (props) => (
  <BaseIcon icon={LuTrash2} className="cursor-pointer text-[#B71C1C]" {...props} />
);

export const Edit = (props) => (
  <BaseIcon icon={LuFilePenLine} className="cursor-pointer text-[#D32F2F]" {...props} />
);

export const View = (props) => (
  <BaseIcon icon={LuEye} className="cursor-pointer text-emerald-600" {...props} />
);

export const Close = ({ onClick, ...props }) => (
  <BaseIcon
    icon={LuX}
    className="cursor-pointer text-slate-500 hover:text-[#D32F2F]"
    onClick={onClick}
    {...props}
  />
);

export const Permission = (props) => (
  <BaseIcon icon={LuShield} className="text-current" {...props} />
);

export const RolePermissions = (props) => (
  <BaseIcon icon={LuShieldCheck} className="text-current" {...props} />
);

export const CalendarDates = (props) => (
  <BaseIcon icon={LuCalendarDays} className="text-current" {...props} />
);

export const SignatureIcon = (props) => (
  <BaseIcon icon={LuSignature} className="text-current" {...props} />
);

export const AppConfigIcon = (props) => (
  <BaseIcon icon={LuSettings2} className="text-current" {...props} />
);

export const DesignationIcon = (props) => (
  <BaseIcon icon={LuBadgeCheck} className="text-current" {...props} />
);

export const FlowIcon = (props) => (
  <BaseIcon icon={LuWorkflow} className="text-current" {...props} />
);

export const ShowIcon = (props) => (
  <BaseIcon icon={LuEye} className="cursor-pointer text-emerald-600" {...props} />
);

export const Mail = (props) => (
  <BaseIcon icon={LuMail} className="cursor-pointer text-[#D32F2F]" {...props} />
);
