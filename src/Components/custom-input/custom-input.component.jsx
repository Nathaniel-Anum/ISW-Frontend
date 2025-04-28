import React from 'react';

const CustomInput = ({ placeholder, width, ...props }) => {
  return (
    <div>
      <input
        style={{ width: width ? width : '20.5rem' }}
        type="text"
        // className="border font-semibold text-sm font-body border-blue-100 rounded-md focus:outline-blue-500 caret-blue-400 text-gray-500 placeholder-shown:text-gray-400 py-1 px-3 placeholder-shown:text-sm focus:outline-1 placeholder-shown:font-body placeholder-shown:font-light"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};

export default CustomInput;
