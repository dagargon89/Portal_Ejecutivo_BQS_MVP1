import { api } from './api'
import type { ApiEnvelope, ImportEncolado, Job } from './types'

export type EntidadImport = 'clientes' | 'cotizaciones'

/** Sube un archivo CSV/XLSX y encola el job `import_inicial` (responde 202). */
export async function subirImportacion(
  archivo: File,
  entidad: EntidadImport | null,
): Promise<ImportEncolado> {
  const form = new FormData()
  form.append('archivo', archivo)
  if (entidad !== null) {
    form.append('entidad', entidad)
  }
  const resp = await api.post<ApiEnvelope<ImportEncolado>>('/v1/admin/import', form)
  return resp.data.data
}

/** Consulta el estado de un job de la cola. */
export async function obtenerJob(id: number): Promise<Job> {
  const resp = await api.get<ApiEnvelope<Job>>(`/v1/admin/jobs/${String(id)}`)
  return resp.data.data
}
