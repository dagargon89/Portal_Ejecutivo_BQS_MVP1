/* Whitelist de acceso (admin): alta y revocación de correos autorizados.
 * Segunda barrera además de credenciales (CLAUDE.md regla 3). UI del demo. */
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { ShieldCheck, Plus, CheckCircle2, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/useAsync'
import { api, errorMessage } from '@/lib/api'
import type { ApiCollectionEnvelope, ApiEnvelope, WhitelistEntry } from '@/lib/types'

async function listarWhitelist(): Promise<WhitelistEntry[]> {
  const resp = await api.get<ApiCollectionEnvelope<WhitelistEntry>>('/v1/admin/whitelist')
  return resp.data.data
}

export function WhitelistPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => listarWhitelist(), [])
  const [nuevo, setNuevo] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function agregar() {
    const correo = nuevo.trim()
    if (correo === '') return
    setGuardando(true)
    try {
      await api.post<ApiEnvelope<WhitelistEntry>>('/v1/admin/whitelist', { correo })
      setNuevo('')
      toast.push({ tipo: 'success', titulo: 'Correo agregado' })
      reload()
    } catch (e) {
      toast.push({ tipo: 'error', titulo: 'No se pudo agregar', descripcion: errorMessage(e) })
    } finally {
      setGuardando(false)
    }
  }

  async function revocar(id: number) {
    try {
      await api.delete(`/v1/admin/whitelist/${String(id)}`)
      toast.push({ tipo: 'success', titulo: 'Acceso revocado' })
      reload()
    } catch (e) {
      toast.push({ tipo: 'error', titulo: 'No se pudo revocar', descripcion: errorMessage(e) })
    }
  }

  const columns: Column<WhitelistEntry>[] = [
    { key: 'correo', header: 'Correo', render: (r) => r.correo },
    {
      key: 'estado',
      header: 'Estado',
      render: (r) =>
        r.activo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-secondary-strong">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            <XCircle className="h-3.5 w-3.5" aria-hidden /> Revocado
          </span>
        ),
    },
    {
      key: 'accion',
      header: '',
      align: 'right',
      thClassName: 'w-28',
      render: (r) =>
        r.activo ? (
          <button
            type="button"
            onClick={() => void revocar(r.id)}
            className="rounded-md border border-danger/30 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            Revocar
          </button>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Whitelist de acceso"
        description="Correos autorizados a iniciar sesión; segunda barrera además de credenciales."
      />

      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void agregar()
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <TextField
              label="Autorizar correo"
              type="email"
              placeholder="correo@empresa.com"
              value={nuevo}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNuevo(e.target.value)}
            />
          </div>
          <Button type="submit" icon={<Plus className="h-4 w-4" aria-hidden />} loading={guardando}>
            Agregar
          </Button>
        </form>
      </Card>

      {loading ? (
        <TableSkeleton cols={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-8 w-8" />}
          title="Sin correos registrados"
          message="Agrega el primer correo autorizado."
        />
      ) : data ? (
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => String(r.id)}
          caption="Correos autorizados"
        />
      ) : null}
    </div>
  )
}
