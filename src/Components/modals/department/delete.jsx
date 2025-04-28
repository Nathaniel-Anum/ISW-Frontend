import React from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { deleteDepartment } from '../../../http/departments';

import Modal from 'antd/es/modal/Modal';
import { useAppStore } from '../../../store/store';
import swal from 'sweetalert';
import { notification } from 'antd';

const DeleteDepartment = () => {
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };
  const queryClient = useQueryClient();
  const showDepartmentDeleteModal = useAppStore(
    (state) => state.showDepartmentDeleteModal
  );

  const toggleDepartmentDeleteModal = useAppStore(
    (state) => state.toggleDepartmentDeleteModal
  );

  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const { mutate, isLoading } = useMutation(
    ['deleteDepartment', selectedRecord.id],
    () => deleteDepartment(selectedRecord.id),
    {
      onSuccess: () => {
        !isLoading && toggleDepartmentDeleteModal();
        queryClient.invalidateQueries({ queryKey: ['departments'] });
        swal({
          text: 'Department deleted successfully',
          title: 'Sucess!',
          icon: 'success',
        });
      },
      onError: (err) => openNotification('error', 'Error', err.message),
    }
  );

  const handleDelete = (id) => {
    try {
      if (id) {
        mutate(id);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="font-body">
      {contextHolder}
      <Modal
        open={showDepartmentDeleteModal}
        onOk={() => handleDelete(selectedRecord && selectedRecord.id)}
        onCancel={toggleDepartmentDeleteModal}
        maskClosable={false}
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl"> Deleting this record is irreverisble</h2>
          <h3>Are you sure you want to delete?</h3>
        </div>
      </Modal>
    </div>
  );
};

export default DeleteDepartment;
