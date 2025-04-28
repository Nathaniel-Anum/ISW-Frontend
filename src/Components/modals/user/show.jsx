import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetUserDetail } from '../../../query_hooks/users/user.query';

import { capitalize } from '../../../utils/capitalize';
import { Close } from '../../icons/icons.components';
import FormsModal from '../forms-modal/forms-modal.component';

const UserShow = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: user } = useGetUserDetail(id);

  return (
    <div className="font-body">
      <FormsModal>
        <div className="flex gap-5 flex-col items-center">
          <h2 className="text-3xl text-primary text-center">User Details</h2>
          {user && (
            <div className="flex flex-col justify-center gap-y-8 -400 mx-auto ">
              {Object.keys(user.data[0]).map(
                (key) =>
                  key !== 'id' &&
                  key === 'division_id' && (
                    <div className="grid grid-cols-2" key={key}>
                      <span className="text-sky-800 ">
                        {' '}
                        {capitalize(key)}:{' '}
                      </span>
                      <span className="text-gray-500">
                        {user?.data[0][key]}
                      </span>
                    </div>
                  )
              )}
            </div>
          )}
          <div className="absolute top-6 right-9">
            <Close onClick={() => navigate('/')} />
          </div>
        </div>
      </FormsModal>
    </div>
  );
};

export default UserShow;
