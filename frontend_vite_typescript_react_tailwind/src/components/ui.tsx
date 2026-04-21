import React from 'react'

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Card(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cx(
        'rounded-3xl border border-slate-200 bg-white/90 shadow-soft backdrop-blur',
        props.className,
      )}
    >
      {props.children}
    </div>
  )
}

export function CardHeader(props: React.PropsWithChildren<{ title: string; subtitle?: string; right?: React.ReactNode }>) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
      <div>
        <div className="text-base font-semibold text-slate-900">{props.title}</div>
        {props.subtitle ? <div className="mt-1 text-sm text-slate-600">{props.subtitle}</div> : null}
      </div>
      {props.right}
    </div>
  )
}

export function CardBody(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cx('p-5', props.className)}>{props.children}</div>
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' },
) {
  const v = props.variant || 'primary'
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed'
  const styles: Record<string, string> = {
    primary: 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-600 hover:to-indigo-600 shadow-sm',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
  }

  return (
    <button {...props} className={cx(base, styles[v], props.className)}>
      {props.children}
    </button>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        'w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200',
        props.className,
      )}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        'w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200',
        props.className,
      )}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        'w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200',
        props.className,
      )}
    />
  )
}

export function Badge(props: React.PropsWithChildren<{ tone?: 'ok' | 'warn' | 'bad' | 'neutral' }>) {
  const tone = props.tone || 'neutral'
  const tones: Record<string, string> = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    bad: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }
  return <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-xs', tones[tone])}>{props.children}</span>
}

export function TabButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={cx(
        'rounded-2xl px-3 py-2 text-sm font-medium transition',
        props.active ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        props.className,
      )}
    />
  )
}
