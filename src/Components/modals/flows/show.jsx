import { Modal, Steps } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { FLOWACTIONS, META } from '../../../../common/constants';

const FlowModal = () => {
  const showFlowShowModal = useAppStore((state) => state.showFlowShowModal);
  const toggleFlowShowModal = useAppStore((state) => state.toggleFlowShowModal);
  const selectedRecord = useAppStore((state) => state.selectedRecord);

  return (
    <div className="m mt">
      <Modal
        open={showFlowShowModal}
        footer={false}
        onCancel={toggleFlowShowModal}
        maskClosable={false}
        width={'60%'}
        centered={true}
      >
        <div className="py-14">
          <Steps
            className="grid grid-cols-2  gap-y-6"
            size="small"
            responsive
            // current={1}
            status="process"
            percent={'90'}
            items={selectedRecord?.approvers?.map((record, idx) => ({
              title: record?.role?.name,
              description: FLOWACTIONS[record?.action],
              subTitle: record.meta.length
                ? ` [${record?.meta.reduce(
                    (acc, meta, idx) =>
                      acc +
                      META[meta] +
                      (idx !== record.meta.length - 1 ? ', ' : ''),
                    ''
                  )}]`
                : '',
              status:
                idx !== selectedRecord?.flow?.length - 1 ? 'process' : 'finish',
            }))}
          >
            {}
          </Steps>
        </div>
      </Modal>
    </div>
  );
};

export default FlowModal;
