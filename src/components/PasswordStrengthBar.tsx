'use client'

import React, { useMemo } from 'react'
import { zxcvbn } from 'zxcvbn-typescript'
import { useTranslations } from 'next-intl'

interface PasswordStrengthBarProps {
  password: string
}

export type PasswordScore = 0 | 1 | 2 | 3 | 4

export function getPasswordStrengthInfo(score: PasswordScore, t: (key: string) => string) {
  switch (score) {
    case 0:
      return {
        label: t('score_0'),
        color: 'bg-rose-500',
        width: 'w-1/5',
      }
    case 1:
      return {
        label: t('score_1'),
        color: 'bg-orange-500',
        width: 'w-2/5',
      }
    case 2:
      return {
        label: t('score_2'),
        color: 'bg-yellow-500',
        width: 'w-3/5',
      }
    case 3:
      return {
        label: t('score_3'),
        color: 'bg-emerald-500',
        width: 'w-4/5',
      }
    case 4:
      return {
        label: t('score_4'),
        color: 'bg-emerald-600',
        width: 'w-full',
      }
    default:
      return {
        label: '',
        color: 'bg-slate-200',
        width: 'w-0',
      }
  }
}

const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ password }) => {
  const t = useTranslations('password_strength')
  
  const result = useMemo(() => {
    if (!password) return null
    return zxcvbn(password)
  }, [password])

  if (!password) return null

  const score = result?.score as PasswordScore
  const info = getPasswordStrengthInfo(score, t)

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-[10px] sm:text-xs">
        <span className="text-slate-600">
          {t('label')}
        </span>
        <span className={`font-medium ${score <= 1 ? 'text-rose-600' : score === 2 ? 'text-yellow-600' : 'text-emerald-600'}`}>
          {info.label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div 
          className={`h-full transition-all duration-300 ${info.color} ${info.width}`}
        />
      </div>
      {result?.feedback?.warning && (
        <p className="text-[10px] sm:text-xs text-rose-500 mt-1">
          {result.feedback.warning}
        </p>
      )}
    </div>
  )
}

export default PasswordStrengthBar
