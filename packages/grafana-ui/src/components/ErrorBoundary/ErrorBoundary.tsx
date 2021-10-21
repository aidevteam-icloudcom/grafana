import React, { PureComponent, ReactNode, ComponentType } from 'react';
import { captureException } from '@sentry/browser';
import { Alert } from '../Alert/Alert';
import { ErrorWithStack } from './ErrorWithStack';

export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorBoundaryApi {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface Props {
  children: (r: ErrorBoundaryApi) => ReactNode;
  /** Will re-render children after error if recover values changes */
  recover?: any[];
  /** Callback called on error */
  onError?: (error: Error) => void;
  /** Callback error state is cleared due to recover props change */
  onRecover?: () => void;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends PureComponent<Props, State> {
  readonly state: State = {
    error: null,
    errorInfo: null,
  };

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    this.setState({ error, errorInfo });

    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryAlertProps) {
    const { recover, onRecover } = this.props;

    if (this.state.error) {
      if (recover && prevProps.recover) {
        for (let i = 0; i < recover.length; i++) {
          if (recover[i] !== prevProps.recover[i]) {
            this.setState({ error: null, errorInfo: null });
            if (onRecover) {
              onRecover();
            }
            break;
          }
        }
      }
    }
  }

  render() {
    const { children } = this.props;
    const { error, errorInfo } = this.state;

    return children({
      error,
      errorInfo,
    });
  }
}

/**
 * Props for the ErrorBoundaryAlert component
 *
 * @public
 */
export interface ErrorBoundaryAlertProps {
  /** Title for the error boundary alert */
  title?: string;

  /** Component to be wrapped with an error boundary */
  children: ReactNode;

  /** 'page' will render full page error with stacktrace. 'alertbox' will render an <Alert />. Default 'alertbox' */
  style?: 'page' | 'alertbox';

  /** Will re-render children after error if recover values changes */
  recover?: any[];
}

export class ErrorBoundaryAlert extends PureComponent<ErrorBoundaryAlertProps> {
  static defaultProps: Partial<ErrorBoundaryAlertProps> = {
    title: 'An unexpected error happened',
    style: 'alertbox',
  };

  render() {
    const { title, children, style, recover } = this.props;

    return (
      <ErrorBoundary recover={recover}>
        {({ error, errorInfo }) => {
          if (!errorInfo) {
            return children;
          }

          if (style === 'alertbox') {
            return (
              <Alert title={title || ''}>
                <details style={{ whiteSpace: 'pre-wrap' }}>
                  {error && error.toString()}
                  <br />
                  {errorInfo.componentStack}
                </details>
              </Alert>
            );
          }

          return <ErrorWithStack title={title || ''} error={error} errorInfo={errorInfo} />;
        }}
      </ErrorBoundary>
    );
  }
}

/**
 * HOC for wrapping a component in an error boundary.
 *
 * @param Component - the react component to wrap in error boundary
 * @param errorBoundaryProps - error boundary options
 *
 * @public
 */
export function withErrorBoundary<P = {}>(
  Component: ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryAlertProps, 'children'> = {}
): ComponentType<P> {
  const comp = (props: P) => (
    <ErrorBoundaryAlert {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundaryAlert>
  );
  comp.displayName = 'WithErrorBoundary';

  return comp;
}
