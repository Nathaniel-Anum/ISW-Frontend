import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../header/header.component';
import Sidebar from '../sidebar/sidebar.components';
import { useAppStore } from '../../store/store';

import { Loader } from '../loader/loader';

const Wrapper = () => {
  const isLoading = useAppStore((state) => state.fetchingUser);

  return !isLoading ? (
    <div className="md:grid min-h-screen md:grid-rows-myrows md:grid-cols-mycols  ">
      <div className=" -mt-1 md:mt-0 md:row-span-full md:col-start-1 md:col-end-2 md:bg-primary ">
        <Sidebar />
      </div>
      <div className="py-1 md:py-4 md:px-5 md:ml-[2%] ">
        <Header />
      </div>
      <div>
        <div className="md:ml-[2%] mt-[39%] md:mt-0">
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    <Loader className={'h-screen w-screen flex justify-center items-center'} />
  );
};

export default Wrapper;
