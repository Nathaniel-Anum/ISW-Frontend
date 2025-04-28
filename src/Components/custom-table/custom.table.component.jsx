import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/store';

import { Delete, Edit, View } from '../icons/icons.components';
import FormsModal from '../modals/forms-modal/forms-modal.component';
import './custom-table.styles.scss';

const CustomTable = ({ customColumns, data, urls }) => {
  const showModal = useAppStore((state) => state.showFormModal);

  return (
    <>
      {showModal && <FormsModal />}
      <table
        className={`custom-table m-h-[40vh]   w-[100%] overflow-auto scrollbar-hide`}
      >
        <thead className=" custom-table__head bg-primary sticky top-0 text-white ">
          <tr className="text-left ">
            {customColumns.map((column, idx) => (
              <th
                className={`pl-2  py-4 ${
                  column.key === 'actions' && 'text-center'
                }`}
                key={column.title}
              >
                {`${column.title}`}
                {/* {console.log('Header Key ', idx)} */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="custom-table__body">
          {data &&
            data.map((value, index) => {
              return (
                <tr className="shadow-md" key={value.id}>
                  {customColumns.map((column, idx) => (
                    <>
                      <td
                        className={` px-3 py-4 text-gray-600  `}
                        key={value.id + idx}
                      >
                        {/* {console.log('Column Key', value.id + idx)} */}
                        {column.key === 'actions' ? (
                          <div className="flex justify-center gap-7">
                            <Link to={`${urls?.view}/${value?.id}`}>
                              <View />
                            </Link>
                            <Link to={`${urls?.edit}/${value?.id}`}>
                              <Edit />
                            </Link>
                            <Link to={`${urls?.delete}/${value?.id}`}>
                              <Delete />
                            </Link>
                          </div>
                        ) : (
                          value[column.key]
                        )}
                      </td>
                    </>
                  ))}
                </tr>
              );
            })}
        </tbody>
      </table>
    </>
  );
};
export default CustomTable;
