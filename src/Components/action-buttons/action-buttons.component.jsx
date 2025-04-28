import React from 'react';
import { Delete, Edit, View } from '../icons/icons.components';

const ActionButtons = ({ actions, id }) => {
  const { viewAction, editAction, deleteAction } = actions;
  return (
    <div className="flex justify-center gap-7">
      <View onClick={viewAction} />
      <Edit onClick={editAction} />
      <Delete onClick={deleteAction} />
    </div>
  );
};

export default ActionButtons;
