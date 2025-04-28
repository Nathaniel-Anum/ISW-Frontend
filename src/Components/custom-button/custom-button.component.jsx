import './custom-button.styles.scss';
const CustomButton = ({ onClick, label, type, width }) => {
  const BUTTON_TYPE = {
    inverted: 'btn-inverted',
    outline: 'btn-outline',
  };

  return (
    <div
      style={{ width: width ? `${width}` : null }}
      className={type ? `btn ${BUTTON_TYPE[type]}  ` : 'btn'}
      onClick={onClick}
    >
      {label}
    </div>
  );
};

export default CustomButton;
