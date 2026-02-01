
import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };
  
  // Explicitly define props to satisfy strict typing if necessary, though React.Component usually handles it.
  public readonly props: Props;

  constructor(props: Props) {
      super(props);
      this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-950 text-white p-8 text-center">
          <AlertTriangle size={64} className="mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Critical System Failure</h1>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-red-600 px-6 py-3 font-bold mt-4">HARD RESET</button>
        </div>
      );
    }
    return this.props.children;
  }
}
