import { Component } from "react";
import { Button } from "antd";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded-xl border border-[#FFCDD2] bg-[#FFF5F5] px-8 py-10">
            <p className="mb-1 text-lg font-semibold text-[#D32F2F]">Something went wrong</p>
            <p className="mb-6 text-sm text-[#757575]">
              An unexpected error occurred. Reload the page to continue.
            </p>
            <Button
              type="primary"
              danger
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
