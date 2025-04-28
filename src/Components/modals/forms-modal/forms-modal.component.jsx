const FormsModal = ({ children }) => {
  return (
    <div className="reviewModal m-h-full bg-white/75 backdrop-blur-md  absolute top-0 right-0 left-[15.625rem] bottom-0 z-50 ">
      <div className="reviewModal__container bg-accent shadow-md  w-[50vw] min-h-[60vh]  top-[50%] left[50%] translate-x-[30%] translate-y-[-88%] absolute  overflow-auto max-h-[80vh] p-5 scrollbar-hide">
        {children}
      </div>
    </div>
  );
};

export default FormsModal;
