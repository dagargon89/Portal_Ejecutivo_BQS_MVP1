/**
 * Almacen del access token EN MEMORIA (nunca localStorage/sessionStorage:
 * requisito de seguridad, Plan de Seguridad 04 §3.5 / ADR-003). Se pierde al
 * recargar la pagina; la sesion se rehidrata via el refresh por cookie.
 */
let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function clearAccessToken(): void {
  accessToken = null
}
