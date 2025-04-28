import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetDepartmentDetail } from '../../../query_hooks/departments/department.query';

import { capitalize } from '../../../utils/capitalize';
import { Close } from '../../icons/icons.components';
import FormsModal from '../forms-modal/forms-modal.component';

const DepartmentShow = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: department } = useGetDepartmentDetail(id);

  return (
    <div className="font-body">
      <FormsModal>
        <div className="flex gap-5 flex-col items-center">
          <h2 className="text-3xl text-primary text-center">
            Department Details
          </h2>
          {department && (
            <div className="flex flex-col justify-center gap-y-8 -400 mx-auto ">
              {Object.keys(department.data[0]).map(
                (key) =>
                  key !== 'id' && (
                    <div className="grid grid-cols-2" key={key}>
                      <span className="text-sky-800 ">
                        {' '}
                        {capitalize(key)}:{' '}
                      </span>
                      <span className="text-gray-500">
                        {department?.data[0][key]}
                      </span>
                    </div>
                  )
              )}
            </div>
          )}
          <div className="absolute top-6 right-9">
            <Close onClick={() => navigate('/departments')} />
          </div>
        </div>
      </FormsModal>
    </div>
  );
};

export default DepartmentShow;
