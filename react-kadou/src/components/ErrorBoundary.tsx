import React from 'react';
import { Button, Result } from 'antd';
import { logger } from '../utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * React 渲染错误边界：捕获子组件渲染/生命周期异常，
 * 上报后端日志并显示友好的错误页面。
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logger.error(
      `render error: ${error.message}\ncomponentStack=${info.componentStack}`,
      error,
    );
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Result
          status='error'
          title='画面表示中にエラーが発生しました'
          subTitle='再読み込みしても解決しない場合は、システム管理者へお問い合わせください。'
          extra={
            <Button type='primary' onClick={() => window.location.reload()}>
              再読み込み
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}
