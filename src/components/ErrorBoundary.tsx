'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import * as Sentry from '@sentry/nextjs'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
}

class ErrorBoundaryClass extends Component<Props & { errorT: (key: string) => string }, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Sentry.captureException(error, { extra: errorInfo as any })
  }

  private handleReset = () => {
    this.setState({ hasError: false })
  }

  public render() {
    if (this.state.hasError) {
      const { errorT } = this.props
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-10 w-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{errorT('title')}</h2>
          <p className="mt-2 max-w-md text-slate-600">
            {errorT('description')}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-6 rounded-xl bg-[#2E7D32] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {errorT('retry')}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default function ErrorBoundary(props: Props) {
  const errorT = useTranslations('error_boundary')
  return <ErrorBoundaryClass {...props} errorT={errorT} />
}
