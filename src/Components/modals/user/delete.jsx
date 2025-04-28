import React from 'react';
// import { useMutation, useQueryClient } from 'react-query';
// import { useNavigate, useParams } from 'react-router-dom';
// import swal from 'sweetalert';
// import { deleteUser } from '../../../http/users';
// import CustomButton from '../../custom-button/custom-button.component';
// import { Close } from '../../icons/icons.components';
// import FormsModal from '../forms-modal/forms-modal.component';
import Modal from 'antd/es/modal/Modal';
import { useAppStore } from '../../../store/store';
import { useMutation } from 'react-query';
import { deleteUser } from '../../../http/users';

const DeleteUser = () => {
  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const { mutate } = useMutation(
    'deleteUser',
    () => deleteUser(selectedRecord?.id),
    {
      onSuccess: () => console.log('User deleted successfully'),
    }
  );
  // const queryClient = useQueryClient();
  // const { id } = useParams();
  // const navigate = useNavigate();
  // const { mutate } = useMutation(['user', id], () => deleteUser(id), {
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['users'] });
  //     swal({
  //       title: '',
  //       text: 'Department deleted sucessfully!',
  //       icon: 'success',
  //       button: 'Ok',
  //     }).then(() => {
  //       navigate('/');
  //     });
  //   },
  // });

  const handleDelete = () => {
    try {
      mutate(selectedRecord.id);
      toggleUsersDeleteModal();
    } catch (err) {
      console.error(err.message);
    }
  };

  const toggleUsersDeleteModal = useAppStore(
    (state) => state.toggleUsersDeleteModal
  );
  const showUsersDeleteModal = useAppStore(
    (state) => state.showUsersDeleteModal
  );
  return (
    <div className="font-body">
      <Modal
        open={showUsersDeleteModal}
        onCancel={() => toggleUsersDeleteModal()}
        onOk={handleDelete}
      >
        <div className="flex flex-col justify-center gap-8">
          <h2 className="text-red-600">Deleting this record is irreverisble</h2>
          <h2 className="text-red-600">Do you want to proceed?</h2>
        </div>
      </Modal>
    </div>
  );
};

export default DeleteUser;
