import React, { useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, message, Upload } from 'antd';

import { useMutation } from 'react-query';
import { uploadEmployees } from '../../http/employees';
const Uploader = ({ openFn }) => {
  const [fileList, setFileList] = useState([]);
  const { mutate } = useMutation(
    'uploadEmployees',
    (data) => uploadEmployees(data),
    {
      onSuccess: () => {
        openFn.success('success', 'Success', 'Successfully uploaded');
      },
      onError: (err) => {
        openFn.error('error', 'Error', err.message);
      },
    }
  );

  const handleFileUpload = () => {
    const selectedFile = fileList[0]?.originFileObj;
    if (!selectedFile) {
      message.error('Select a file before uploading');
      return;
    }

    const formData = new FormData();

    formData.append('file', selectedFile);

    mutate(formData);
  };

  const props = {
    name: 'file',
    beforeUpload: () => false,
    onChange(info) {
      setFileList(info.fileList.slice(-1));
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };
  return (
    <>
      <Upload {...props}>
        <Button icon={<UploadOutlined />} onClick={handleFileUpload}>
          Upload Signature
        </Button>
      </Upload>
    </>
  );
};
export default Uploader;
