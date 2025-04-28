import React from 'react';
import Layout from './Layout';
import { Outlet } from 'react-router-dom';

const DLayout = () => {
    return (
        <div>
            <Layout/>
            <Outlet/>
        </div>
    );
};

export default DLayout;