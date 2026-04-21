import React from 'react'
import { Card, CardBody, CardHeader, Button } from './ui'
import { Copy, Download } from 'lucide-react'

function pretty(v: unknown) {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

export default function JsonPanel(props: { title: string; value: unknown; filename?: string }) {
  const text = pretty(props.value)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
  }

  const download = () => {
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.filename || 'response.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="h-full">
      <CardHeader
        title={props.title}
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={copy} title="Copy JSON"><Copy className="h-4 w-4" />Copy</Button>
            <Button variant="secondary" onClick={download} title="Download JSON"><Download className="h-4 w-4" />Save</Button>
          </div>
        }
      />
      <CardBody className="h-full">
        <pre className="max-h-[520px] overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-800">{text}</pre>
      </CardBody>
    </Card>
  )
}
