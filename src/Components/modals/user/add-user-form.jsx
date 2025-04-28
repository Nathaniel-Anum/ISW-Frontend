import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { addUser } from '../../../http/users';
import { useAppStore } from '../../../store/store';
import CustomButton from '../../custom-button/custom-button.component';
import { Close } from '../../icons/icons.components';
import FormsModal from '../forms-modal/forms-modal.component';

const AddUserForm = () => {
  const toggleFormModal = useAppStore((state) => state.toggleFormModal);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role_id: '',
      status: '',
    },
  });

  // const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate } = useMutation(
    ['users_add'],
    () => addUser({ ...getValues() }),
    {
      onSuccess: () => {
        toggleFormModal();
        swal({
          title: '',
          text: 'User added sucessfully!',
          icon: 'success',
          button: 'Ok',
        }).then(() => {
          reset();
        });
        queryClient.invalidateQueries({
          queryKey: ['users'],
        });
      },
    }
  );

  const handleUserSubmit = (data) => {
    mutate(data);
  };
  return (
    <div>
      <FormsModal>
        <form className="flex gap-4 flex-col  items-center  w-full h-[500px] scrollbar-hide overflow-auto ">
          <h2 className="text-primary text-3xl my-6 ">Add New User</h2>

          <div className="flex flex-col">
            <input
              {...register('name', {
                required: 'Name field is required',
              })}
              className=" w-[20rem] border font-semibold text-sm font-body border-blue-100 rounded-md focus:outline-blue-500 caret-blue-400 text-gray-500 placeholder-shown:text-gray-400 py-1 px-3 placeholder-shown:text-sm focus:outline-1 placeholder-shown:font-body placeholder-shown:font-light"
              placeholder={'Name'}
            />
            <span className=" text-red-400 text-sm">
              {errors?.name?.message}
            </span>
          </div>
          <div className="flex flex-col text-sm">
            <input
              type={'email'}
              className=" w-[20rem] border font-semibold text-sm font-body border-blue-100 rounded-md focus:outline-blue-500 caret-blue-400 text-gray-500 placeholder-shown:text-gray-400 py-1 px-3 placeholder-shown:text-sm focus:outline-1 placeholder-shown:font-body placeholder-shown:font-light"
              {...register('email', { required: 'Email field is required' })}
              placeholder={'Email'}
            />
            <span className=" text-red-400 text-sm">
              {errors?.email?.message}
            </span>
          </div>
          <div className="flex flex-col">
            <input
              type={'password'}
              className=" w-[20rem] border font-semibold text-sm font-body border-blue-100 rounded-md focus:outline-blue-500 caret-blue-400 text-gray-500 placeholder-shown:text-gray-400 py-1 px-3 placeholder-shown:text-sm focus:outline-1 placeholder-shown:font-body placeholder-shown:font-light"
              {...register('password', {
                required: 'Password field is required',
              })}
              placeholder={'Password'}
            />
            <span className=" text-red-400 text-sm">
              {errors?.password?.message}
            </span>
          </div>
          <div className="flex flex-col">
            <select
              {...register('role_id', { required: 'Role is required' })}
              className={
                'w-[20rem] border font-semibold text-sm font-body border-blue-100 rounded-md focus:outline-blue-500 caret-blue-400 text-gray-500 py-1 px-3'
              }
            >
              <option value="" disabled>
                Select Role
              </option>
              <option value="1">User</option>
              <option value="2">Head Of Department</option>
              <option value="3">Schedule Officer</option>
              <option value="4">Welfare Manager</option>
              <option value="5">Director HR</option>
            </select>
            <span className=" text-red-400 text-sm">
              {errors?.role_id?.message}
            </span>
          </div>
          <div className="flex flex-col">
            <select
              {...register('status', { required: 'status is required' })}
              className={
                'w-[20rem] border font-semibold text-sm font-body border-blue-100 rounded-md focus:outline-blue-500 caret-blue-400 text-gray-500 py-1 px-3'
              }
            >
              <option value="" disabled>
                Select Status
              </option>
              <option value="Active">Active</option>
              <option value="InActive">InActive</option>
            </select>
          </div>

          <div className="mb-4">
            <CustomButton
              label={'Submit'}
              width={'20rem'}
              onClick={handleSubmit((data) => handleUserSubmit(data))}
            />
          </div>
          <div className="absolute top-6 right-9">
            <Close onClick={toggleFormModal} />
          </div>
        </form>
      </FormsModal>
    </div>
  );
};

export default AddUserForm;
