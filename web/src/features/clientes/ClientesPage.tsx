/* Clientes (CAT_CLIENTES): lista con búsqueda consolidada (RF-CLI-01) y filtro
 * por estatus; alta/edición (rol admin, RF-CLI-02) en modal; baja lógica.
 * UI re-estilizada del demo, cableada a la capa real (lib/clientes + Axios). */
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useSession } from '@/auth/session'
import { useAsync } from '@/hooks/useAsync'
import { errorFields, errorMessage } from '@/lib/api'
import {
  actualizarCliente,
  crearCliente,
  darDeBajaCliente,
  listarClientes,
} from '@/lib/clientes'
import type { ClientePayload } from '@/lib/clientes'
import type { Cliente } from '@/lib/types'

const VACIO: ClientePayload = {
  ID_Cliente: '',
  Nombre_Fiscal: '',
  Nombre_Comercial: '',
  RFC: '',
  Estatus: 'Activo',
}

function EstatusPill({ estatus }: { estatus: string }) {
  return estatus === 'Activo' ? (
    <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-secondary-strong">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      Inactivo
    </span>
  )
}

export function ClientesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { hasRole } = useSession()
  const esAdmin = hasRole('admin')

  const [q, setQ] = useState('')
  const [estatus, setEstatus] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<ClientePayload | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const { data, loading, error, reload } = useAsync(
    () => listarClientes({ q: q || undefined, estatus: estatus || undefined, page }),
    [q, estatus, page],
  )

  function abrirNuevo() {
    setEditandoId(null)
    setForm({ ...VACIO })
  }

  function abrirEdicion(c: Cliente) {
    setEditandoId(c.ID_Cliente)
    setForm({
      ID_Cliente: c.ID_Cliente,
      Nombre_Fiscal: c.Nombre_Fiscal,
      Nombre_Comercial: c.Nombre_Comercial ?? '',
      RFC: c.RFC ?? '',
      Estatus: c.Estatus,
    })
  }

  async function darBaja(c: Cliente) {
    if (!window.confirm(`¿Dar de baja lógica a ${c.Nombre_Fiscal}? Quedará como Inactivo.`)) return
    try {
      await darDeBajaCliente(c.ID_Cliente)
      toast.push({ tipo: 'success', titulo: 'Cliente dado de baja' })
      reload()
    } catch (e) {
      toast.push({ tipo: 'error', titulo: 'No se pudo dar de baja', descripcion: errorMessage(e) })
    }
  }

  const columns: Column<Cliente>[] = [
    { key: 'id', header: 'ID', mono: true, render: (r) => r.ID_Cliente },
    { key: 'comercial', header: 'Comercial', render: (r) => r.Nombre_Comercial ?? '—' },
    { key: 'fiscal', header: 'Razón social', render: (r) => r.Nombre_Fiscal },
    { key: 'rfc', header: 'RFC', mono: true, render: (r) => r.RFC ?? '—' },
    { key: 'estatus', header: 'Estatus', render: (r) => <EstatusPill estatus={r.Estatus} /> },
    ...(esAdmin
      ? [
          {
            key: 'acciones',
            header: '',
            align: 'right' as const,
            thClassName: 'w-32',
            render: (r: Cliente) => (
              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => abrirEdicion(r)}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Editar
                </button>
                {r.Estatus === 'Activo' ? (
                  <button
                    type="button"
                    onClick={() => void darBaja(r)}
                    className="rounded-md border border-danger/30 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                  >
                    Baja
                  </button>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Catálogo maestro con ID único (consolida nombres variantes)."
        actions={
          esAdmin ? (
            <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={abrirNuevo}>
              Nuevo cliente
            </Button>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="Buscar por nombre, RFC o ID…"
              aria-label="Buscar clientes"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Select
            label=""
            aria-label="Filtrar por estatus"
            value={estatus}
            onChange={(e) => {
              setEstatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todos los estatus</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <TableSkeleton cols={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.clientes.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Sin clientes"
          message="No hay clientes que coincidan con la búsqueda."
        />
      ) : data ? (
        <>
          <DataTable
            columns={columns}
            rows={data.clientes}
            rowKey={(r) => r.ID_Cliente}
            onRowClick={(r) => navigate(`/clientes/${encodeURIComponent(r.ID_Cliente)}`)}
            caption="Lista de clientes"
          />
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      ) : null}

      <ClienteModal
        form={form}
        editandoId={editandoId}
        onClose={() => {
          setForm(null)
          setEditandoId(null)
        }}
        onSaved={() => {
          setForm(null)
          setEditandoId(null)
          toast.push({ tipo: 'success', titulo: editandoId ? 'Cliente actualizado' : 'Cliente creado' })
          reload()
        }}
      />
    </div>
  )
}

function ClienteModal({
  form,
  editandoId,
  onClose,
  onSaved,
}: {
  form: ClientePayload | null
  editandoId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [local, setLocal] = useState<ClientePayload>(form ?? VACIO)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)

  // Sincroniza el estado local cuando se abre/cambia el cliente a editar.
  const sig = form ? `${editandoId ?? 'nuevo'}:${form.ID_Cliente}` : null
  if (sig !== signature) {
    setSignature(sig)
    setLocal(form ?? VACIO)
    setErrors({})
  }

  const set =
    (k: keyof ClientePayload) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setLocal((f) => ({ ...f, [k]: e.target.value }))

  async function guardar() {
    setSaving(true)
    setErrors({})
    try {
      const payload: ClientePayload = {
        ...local,
        ID_Cliente: local.ID_Cliente.trim().toUpperCase(),
        Nombre_Fiscal: local.Nombre_Fiscal.trim(),
        Nombre_Comercial: local.Nombre_Comercial?.trim() ? local.Nombre_Comercial.trim() : null,
        RFC: local.RFC?.trim() ? local.RFC.trim().toUpperCase() : null,
      }
      if (editandoId !== null) {
        const { ID_Cliente: _omit, ...resto } = payload
        void _omit
        await actualizarCliente(editandoId, resto)
      } else {
        await crearCliente(payload)
      }
      onSaved()
    } catch (e) {
      const fields = errorFields(e)
      if (fields) setErrors(fields)
      toast.push({ tipo: 'error', titulo: 'No se pudo guardar', descripcion: errorMessage(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={form !== null}
      title={editandoId !== null ? `Editar ${editandoId}` : 'Nuevo cliente'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {editandoId === null ? (
          <TextField
            label="ID Cliente"
            placeholder="CLI-014"
            value={local.ID_Cliente}
            onChange={set('ID_Cliente')}
            error={errors.ID_Cliente}
            hint="Formato CLI-XXX."
          />
        ) : null}
        <TextField
          label="Razón social"
          placeholder="Bocar Group S.A. de C.V."
          value={local.Nombre_Fiscal}
          onChange={set('Nombre_Fiscal')}
          error={errors.Nombre_Fiscal}
        />
        <TextField
          label="Nombre comercial"
          placeholder="Bocar"
          value={local.Nombre_Comercial ?? ''}
          onChange={set('Nombre_Comercial')}
        />
        <TextField
          label="RFC"
          placeholder="BGR990817AB2"
          value={local.RFC ?? ''}
          onChange={set('RFC')}
          error={errors.RFC}
          hint="12–13 caracteres."
        />
        <Select label="Estatus" value={local.Estatus} onChange={set('Estatus')}>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </Select>
      </div>
    </Modal>
  )
}
