import { Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import { deleteDivision } from '../../../http/divisions';
import swal from 'sweetalert';

const DeleteDivision = () => {
  const showDivisionsDeleteModal = useAppStore(
    (state) => state.showDivisionsDeleteModal
  );
  const toggleDivisionsDeleteModal = useAppStore(
    (state) => state.toggleDivisionsDeleteModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const selectedRecord = useAppStore((state) => state.selectedRecord);
  const queryClient = useQueryClient();
  const { mutate } = useMutation('deleteDivision', (id) => deleteDivision(id), {
    onSuccess: () => {
      toggleDivisionsDeleteModal();
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      swal({
        title: 'Success',
        text: 'Division deleted successfully',
        icon: 'success',
      });
    },
    onError: (err) => {
      openNotification('error', 'Error', err.message);
    },
  });

  const handleDelete = () => {
    mutate(selectedRecord.id);
  };

  return (
    <div className="font-body">
      {contextHolder}
      <Modal
        open={showDivisionsDeleteModal}
        onOk={() => handleDelete(selectedRecord && selectedRecord.id)}
        onCancel={toggleDivisionsDeleteModal}
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

export default DeleteDivision;
