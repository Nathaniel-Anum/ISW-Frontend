import React from 'react';
import { useMutation, useQueryClient } from 'react-query';

import Modal from 'antd/es/modal/Modal';
import { useAppStore } from '../../../store/store';
import swal from 'sweetalert';

import { notification } from 'antd';
import { deleteRole } from '../../../http/roles';

const DeleteRole = () => {
  const queryClient = useQueryClient();
  const showRolesDeleteModal = useAppStore(
    (state) => state.showRolesDeleteModal
  );

  const toggleRolesDeleteModal = useAppStore(
    (state) => state.toggleRolesDeleteModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const { mutate, isLoading } = useMutation(
    ['deleteHoliday', selectedRecord.id],
    () => deleteRole(selectedRecord.id),
    {
      onSuccess: () => {
        !isLoading && toggleRolesDeleteModal();
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        swal({
          text: 'Roles deleted successfully',
          title: 'Success!',
          icon: 'success',
        });
      },

      onError: (err) => {
        openNotification('error', 'Error', err.message);
      },
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
        open={showRolesDeleteModal}
        onOk={() => handleDelete(selectedRecord && selectedRecord.id)}
        onCancel={toggleRolesDeleteModal}
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

export default DeleteRole;
