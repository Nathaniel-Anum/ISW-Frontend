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

  const handleFileUpload = (values) => {
    
    const formData = new FormData();

    formData.append('file', '');

    mutate(formData);
  };

  const props = {
    name: 'file',
    beforeUpload: () => false,
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
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
