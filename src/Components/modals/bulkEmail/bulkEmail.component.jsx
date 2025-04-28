import { Button, Modal, Spin } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import email from '../../../assets/email.svg';
import { useMutation } from 'react-query';
import { sendEmail } from '../../../http/sendBulkEmail';
import swal from 'sweetalert';

const SendBulkEmail = () => {
  const showBulkEmailModal = useAppStore((state) => state.showBulkEmailModal);
  const toggleBulkEmailModal = useAppStore(
    (state) => state.toggleBulkEmailModal
  );

  const toggleShowLoader = useAppStore((state) => state.toggleShowLoader);

  const { mutate, isLoading } = useMutation('sendBulkEmail', sendEmail, {
    onSuccess: (data) => {
      toggleShowLoader();
      swal({
        title: 'Success',
        icon: 'success',
        text: data,
      });
    },
  });

  const handleSubmit = () => {
    mutate();
    toggleBulkEmailModal();
    toggleShowLoader();
  };

  return (
    <Modal
      open={showBulkEmailModal}
      footer={false}
      onCancel={toggleBulkEmailModal}
      centered={true}
    >
      <div>
        <img src={email} alt="" width={400} height={400} />

        <div className="mt-10 flex gap-3 flex-col">
          <p className="flex justify-center text-primary">
            Send Email to All Employees
          </p>
          <div className="flex justify-center gap-2">
            <Button
              className="bg-primary text-white"
              onClick={handleSubmit}
              loading={isLoading}
            >
              OK
            </Button>
            <Button
              className="bg-red-600 text-white hover:text-white"
              onClick={toggleBulkEmailModal}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SendBulkEmail;
