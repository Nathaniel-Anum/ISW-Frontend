import React from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '../../store/store';
import { logout } from '../../http/auth';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Mail } from '../icons/icons.components';
import SendBulkEmail from '../modals/bulkEmail/bulkEmail.component';
import { Dropdown, Space, Spin } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { capitalize } from '../../utils/capitalize';
import moment from 'moment';

const Header = () => {
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const showBulkEmailModal = useAppStore((state) => state.showBulkEmailModal);
  const showLoader = useAppStore((state) => state.showLoader);
  const toggleBulkEmailModal = useAppStore(
    (state) => state.toggleBulkEmailModal
  );
  const navigate = useNavigate();
  const { mutate } = useMutation('logout', logout, {
    onSuccess: () => {
      localStorage.removeItem('authTokens');
      setCurrentUser(null);
      navigate('/login');
    },
  });

  const logoutUser = () => {
    mutate();
  };

  const nameParts = currentUser?.name?.split(' ');
  const initials =
    nameParts?.map((element) => element.charAt(0)).join(' ') || '';

  const menuItems = [
    {
      label: <a onClick={logoutUser}>Logout</a>,
      key: '0',
    },
  ];

  return (
    <div className="md:relative fixed w-full md:min-h-0 min-h-[15%]  z-10 md:bg-transparent bg-primary px-2 py-1 md:py-0 md:px-0  ">
      <div className="w-full flex justify-between items-center gap-2 mb-3 mt-3">
        <div className="text-accent font-semibold">{moment().format('LL')}</div>

        <div className="flex justify-between gap-4 items-center">
          <div className="max-sm:hidden bg-primary  text-xs rounded-full p-2 text-white font-semibold font-body transition-all">
            {initials}
          </div>
          <div className="text-primary max-sm:text-white font-semibold">
            <Dropdown
              className="cursor-pointer"
              trigger={['click']}
              menu={{
                items: [
                  {
                    label: (
                      <a
                        onClick={mutate}
                        className="text-primary font-body font-semibold"
                      >
                        Logout
                      </a>
                    ),
                    key: '0',
                  },
                ],
              }}
            >
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  {currentUser
                    ? capitalize(currentUser.name.toLowerCase())
                    : ''}
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
          </div>
        </div>
      </div>
      <h3 className="max-sm:hidden font-body md:font-openSans mt-12 md:mt-0 font-semibold md:text-3xl md:font-bold text-white md:text-zinc-700">
        Admin Panel
      </h3>
    </div>
  );
};

export default Header;
