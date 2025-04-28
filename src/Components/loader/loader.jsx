import Lottie from 'lottie-react';
import loader from '../../assets/loader.json';
export const Loader = ({ className }) => {
  return (
    <div className={className}>
      <div className="w-32 h-32">
        <Lottie
          animationData={loader}
          aria-aria-labelledby="use lottie animation"
        />
      </div>
    </div>
  );
};
