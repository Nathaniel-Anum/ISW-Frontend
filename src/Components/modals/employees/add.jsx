import React, { useState } from 'react';

import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { addEmployee } from '../../../http/employees';

import { useGetAllDepartments } from '../../../query_hooks/departments/department.query';
import { useGetAllDistricts } from '../../../query_hooks/districts/districts.query';
import { useGetAllRegions } from '../../../query_hooks/regions/region.query';
import { useGetAllRoles } from '../../../query_hooks/roles/roles.query';
import { useAppStore } from '../../../store/store';

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
import { useGetAllSupervisors } from '../../../query_hooks/employees/employees.query';

import { useGetAllDesignations } from '../../../query_hooks/designations/designation.query';
import { capitalize } from '../../../utils/capitalize';
import { useGetAllDivisions } from '../../../query_hooks/divisions/divisions.query';
import { checkActualRole, ROLES } from '../../../utils/roles';

const AddEmployee = () => {
  const { data: departments } = useGetAllDepartments();
  const { data: divisions } = useGetAllDivisions();
  const { data: districts } = useGetAllDistricts();
  const { data: regions } = useGetAllRegions();
  const { data: roles } = useGetAllRoles();
  const { data: supervisors } = useGetAllSupervisors();
  const { data: designations } = useGetAllDesignations();

  const [filteredDistrict, setfilteredDistrict] = useState([]);

  const showEmployeesAddModal = useAppStore(
    (state) => state.showEmployeesAddModal
  );
  const currentUser = useAppStore((state) => state.currentUser);
  const toggleEmployeesAddModal = useAppStore(
    (state) => state.toggleEmployeesAddModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation(
    'employeesAdd',
    (values) => addEmployee(values),
    {
      onSuccess: () => {
        toggleEmployeesAddModal();
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        swal({
          title: 'Success',
          icon: 'success',
          description: 'Employee Added successfully',
        });
      },
      onError: (err) => {
        openNotification('error', 'Error', err.message);
      },
    }
  );

  const handleSelectChange = (value) => {
    const returnedValue = districts.data.filter(
      (district) => district.region.id === value
    );
    setfilteredDistrict(returnedValue);
  };

  function filterOption(input, option) {
    return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  }

  const handleUserSubmit = (data) => {
    try {
      const values = {
        ...data,
        role_id:
          typeof data['role_id'] !== 'number'
            ? data['role_id']
            : Array(data['role_id']),
        staff_number: parseInt(data['staff_number']),
        hire_date: data['hire_date'].toISOString(),
      };
      mutate(values);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={showEmployeesAddModal}
        onCancel={toggleEmployeesAddModal}
        footer={false}
        maskClosable={false}
      >
        <div className="max-h-[80vh] overflow-y-auto p-6 mx-auto">
          <Form
            layout="vertical"
            requiredMark={true}
            onFinish={(value) => handleUserSubmit(value)}
          >
            <Form.Item
              label={'Name'}
              name={'name'}
              rules={[{ required: true, message: 'Name field required' }]}
            >
              <Input placeholder={'Enter Name'} />
            </Form.Item>
            {checkActualRole(currentUser, ROLES.SUPERADMIN) && (
              <Form.Item
                name={'division_id'}
                label="Division"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder={'Select Division'}
                  options={divisions?.data?.map((div) => ({
                    label: div.name,
                    value: div.id,
                  }))}
                />
              </Form.Item>
            )}

            <Form.Item
              label={'Staff Number'}
              name={'staff_number'}
              rules={[
                { required: true, message: 'Staff Number field required' },
                {
                  validator: (_, value) => {
                    if (value.length < 3) {
                      return Promise.reject(
                        new Error(
                          'Staff Number cannot be less than 3 characters'
                        )
                      );
                    } else if (value.length > 8) {
                      return Promise.reject(
                        new Error('Staff Number cannot exceed 8 characters')
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input controls={false} placeholder={'Enter Staff Number'} />
            </Form.Item>
            <Form.Item
              label={'Email'}
              name={'email'}
              rules={[{ required: true, message: 'Email field required' }]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>

            <Form.Item
              label={'Designation'}
              name={'designation_id'}
              rules={[
                { required: true, message: 'Designation field required' },
              ]}
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
              label={'Empoloyee Type'}
              name={'employee_type'}
              rules={[
                { required: true, message: 'Employee Type  field required' },
              ]}
            >
              <Select
                placeholder={'Select Employee Type'}
                onChange={() => {}}
                options={[
                  {
                    label: 'Management',
                    value: 'MANAGEMENT',
                  },
                  {
                    label: 'Senior',
                    value: 'SENIOR',
                  },
                  {
                    label: 'Junior',
                    value: 'JUNIOR',
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              label={'Hire Date'}
              name={'hire_date'}
              rules={[{ required: true, message: 'Hire Date field required' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              label={'Role'}
              name={'role_id'}
              rules={[{ required: true, message: 'Role field required' }]}
            >
              <Select
                mode="multiple"
                showSearch={true}
                optionFilterProp={'label'}
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
              // rules={[{ required: true, message: 'Supervisor field required' }]}
            >
              <Select
                showSearch
                optionFilterProp={'label'}
                placeholder={'Select Supervisor'}
                onChange={() => {}}
                options={supervisors?.data.map((supervisor) => ({
                  label: supervisor.user.name,
                  value: supervisor.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Department"
              name={'dept_id'}
              // rules={[{ required: true, message: 'Department field required' }]}
            >
              <Select
                showSearch
                optionFilterProp={'label'}
                placeholder={'Select Department'}
                onChange={() => {}}
                options={departments?.data.map((department) => ({
                  label: capitalize(department.name.toLowerCase()),
                  value: department.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="Region"
              name={'region_id'}
              rules={[{ required: true, message: 'Region field required' }]}
            >
              <Select
                placeholder={'Select Region'}
                onChange={(value) => handleSelectChange(value)}
                options={regions?.data.map((region) => ({
                  label: region.name,
                  value: region.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="District"
              name={'district_id'}
              rules={[{ required: true, message: 'District field required' }]}
            >
              <Select
                placeholder={'Select District'}
                onChange={() => {}}
                options={filteredDistrict.map((district) => ({
                  label: district.name,
                  value: district.id,
                }))}
              />
            </Form.Item>

            <Form.Item>
              <Button
                htmlType="submit"
                type="primary"
                loading={isLoading}
                className="w-full"
              >
                Add Employee
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default AddEmployee;
