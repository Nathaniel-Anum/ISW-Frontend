import { notification } from 'antd';
import React from 'react';

const useNotification = ({ icon, message, description }) => {
  const [api, contextHolder] = notification.useNotification();

  const openNotification = () => {
    api.open({
      icon,
      message,
      description,
    });
  };

  return [contextHolder, openNotification];
};

export default useNotification;
