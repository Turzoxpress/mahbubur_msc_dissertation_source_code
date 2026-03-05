import React from 'react'

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Card(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-white/10 bg-slate-900/50 shadow-soft backdrop-blur',
        props.className,
      )}
    >
      {props.children}
    </div>
  )
}

export function CardHeader(props: React.PropsWithChildren<{ title: string; subtitle?: string; right?: React.ReactNode }>) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
      <div>
        <div className="text-base font-semibold text-white">{props.title}</div>
        {props.subtitle ? <div className="mt-1 text-sm text-slate-300">{props.subtitle}</div> : null}
      </div>
      {props.right}
    </div>
  )
}

export function CardBody(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cx('p-4', props.className)}>{props.children}</div>
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' },
) {
  const v = props.variant || 'primary'
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed'
  const styles: Record<string, string> = {
    primary: 'bg-indigo-500 text-white hover:bg-indigo-400',
    secondary: 'bg-white/10 text-white hover:bg-white/15 border border-white/10',
    ghost: 'bg-transparent text-slate-200 hover:bg-white/10',
    danger: 'bg-rose-500 text-white hover:bg-rose-400',
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
        'w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20',
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
        'w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20',
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
        'w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20',
        props.className,
      )}
    />
  )
}

export function Badge(props: React.PropsWithChildren<{ tone?: 'ok' | 'warn' | 'bad' | 'neutral' }>) {
  const tone = props.tone || 'neutral'
  const tones: Record<string, string> = {
    ok: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    warn: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    bad: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    neutral: 'bg-white/10 text-slate-200 border-white/10',
  }
  return <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-xs', tones[tone])}>{props.children}</span>
}

export function TabButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={cx(
        'rounded-xl px-3 py-2 text-sm font-medium transition',
        props.active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
        props.className,
      )}
    />
  )
}
