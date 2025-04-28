import React from 'react';
import { useMutation, useQueryClient } from 'react-query';

import swal from 'sweetalert';

import { updateEmployee } from '../../../http/employees';
import { useGetAllDepartments } from '../../../query_hooks/departments/department.query';
import { useGetAllDistricts } from '../../../query_hooks/districts/districts.query';
import { useGetAllRegions } from '../../../query_hooks/regions/region.query';
import { useGetAllRoles } from '../../../query_hooks/roles/roles.query';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  notification,
} from 'antd';
import { useAppStore } from '../../../store/store';
import dayjs from 'dayjs';
import { useGetAllSupervisors } from '../../../query_hooks/employees/employees.query';
import { useGetAllDesignations } from '../../../query_hooks/designations/designation.query';
import { capitalize } from '../../../utils/capitalize';
import { checkActualRole, ROLES } from '../../../utils/roles';
import { useGetAllDivisions } from '../../../query_hooks/divisions/divisions.query';

const EditEmployees = () => {
  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const { data: departments } = useGetAllDepartments();
  const { data: divisions } = useGetAllDivisions();
  const { data: districts } = useGetAllDistricts();
  const { data: regions } = useGetAllRegions();
  const { data: roles } = useGetAllRoles();
  const { data: designations } = useGetAllDesignations();

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  console.log(selectedRecord.supervisor?.user.id);

  const queryClient = useQueryClient();
  const { data: supervisors } = useGetAllSupervisors();

  const { mutate } = useMutation(
    ['updateemployee', selectedRecord.id],
    (data) => updateEmployee(selectedRecord.id, data),

    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        toggleEmployeesEditModal();
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Employees updated successfully',
        });
      },

      onError: (err) => {
        openNotification('error', 'Error', err.message);
      },
    }
  );

  const handleUpdate = (values) => {
    const data = {
      ...values,
      role_id:
        typeof values['role_id'] !== 'number'
          ? values['role_id']
          : Array(values['role_id']),
      hire_date: values['hire_date'].toISOString(),
    };

    mutate(data);
  };

  const showEmployeesEditModal = useAppStore(
    (state) => state.showEmployeesEditModal
  );
  const currentUser = useAppStore((state) => state.currentUser);

  const toggleEmployeesEditModal = useAppStore(
    (state) => state.toggleEmployeesEditModal
  );

  return (
    <div className="font-body">
      {contextHolder}
      <Modal
        open={showEmployeesEditModal}
        footer={false}
        onCancel={toggleEmployeesEditModal}
        maskClosable={false}
      >
        <div className="h-[60vh] overflow-y-auto py-3 flex  flex-col items-center">
          <h2 className="text-center font-semibold text-xl text-primary pb-4">
            Update Employee Details
          </h2>
          <Form
            layout="vertical"
            onFinish={(values) => {
              handleUpdate(values);
            }}
          >
            {checkActualRole(currentUser, ROLES.SUPERADMIN) && (
              <Form.Item
                name={'division_id'}
                label="Division"
                initialValue={selectedRecord?.division.id}
              >
                <Select
                  options={divisions?.data?.map((div) => ({
                    label: div.name,
                    value: div.id,
                  }))}
                />
              </Form.Item>
            )}
            <Form.Item
              label={'Name'}
              name={'name'}
              initialValue={selectedRecord.user.name}
            >
              <Input placeholder={'Enter Name'} />
            </Form.Item>
            <Form.Item
              label={'Staff Number'}
              name={'staff_number'}
              initialValue={selectedRecord.staff_number}
            >
              <InputNumber
                controls={false}
                placeholder={'Enter Staff Number'}
                className="w-full"
              />
            </Form.Item>
            <Form.Item
              label={'Email'}
              name={'email'}
              initialValue={selectedRecord.user.email}
            >
              <Input placeholder="Enter email" />
            </Form.Item>

            <Form.Item
              label={'Role'}
              name={'role_id'}
              initialValue={
                selectedRecord.user.role &&
                selectedRecord.user?.role.map((role) => role.id)
              }
            >
              <Select
                mode="multiple"
                optionFilterProp={'label'}
                showSearch
                placeholder={'Select Role'}
                onChange={() => {}}
                options={roles?.data.map((role) => ({
                  label: role.name,
                  value: role.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              label={'Supervisor'}
              name={'supervisor_id'}
              initialValue={selectedRecord.supervisor?.id}
            >
              <Select
                showSearch
                optionFilterProp={'label'}
                placeholder={'Select Supervisor'}
                onChange={() => {}}
                options={
                  supervisors?.data &&
                  supervisors?.data.map((supervisor) => ({
                    label: supervisor?.user?.name,
                    value: supervisor?.id,
                  }))
                }
              />
            </Form.Item>

            <Form.Item
              label={'Hire Date'}
              name={'hire_date'}
              initialValue={dayjs(selectedRecord?.hire_date)}
            >
              <DatePicker style={{ width: 400 }} />
            </Form.Item>

            <Form.Item
              label={'Designation'}
              name={'designation_id'}
              initialValue={selectedRecord?.designation?.id}
            >
              <Select
                showSearch={true}
                optionFilterProp={'label'}
                placeholder={'Select Designation'}
                options={designations?.data.map((designation) => ({
                  value: designation.id,
                  label: capitalize(designation.name.toLowerCase()),
                }))}
              />
            </Form.Item>

            <Form.Item
              label={'Employee Type'}
              name={'employee_type'}
              initialValue={selectedRecord.employee_type}
            >
              <Select
                onChange={() => {}}
                options={[
                  {
                    label: 'Junior',
                    value: 'JUNIOR',
                  },
                  {
                    label: 'Senior',
                    value: 'SENIOR',
                  },
                  {
                    label: 'Management',
                    value: 'MANAGEMENT',
                  },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="Department"
              name={'dept_id'}
              initialValue={selectedRecord.department?.id}
            >
              <Select
                showSearch
                optionFilterProp={'label'}
                onChange={() => {}}
                options={departments?.data.map((department) => ({
                  label: capitalize(department.name.toLowerCase()),
                  value: department?.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="District"
              name={'district_id'}
              initialValue={selectedRecord.district?.id}
            >
              <Select
                onChange={() => {}}
                options={districts?.data.map((district) => ({
                  label: district.name,
                  value: district.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="Region"
              name={'region_id'}
              initialValue={selectedRecord.region?.id}
            >
              <Select
                onChange={() => {}}
                options={regions?.data.map((region) => ({
                  label: region.name,
                  value: region.id,
                }))}
              />
            </Form.Item>
            <Form.Item>
              <Button htmlType="submit" type="primary" className="w-full">
                Update Employee
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default EditEmployees;
