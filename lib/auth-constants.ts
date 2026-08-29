export const ADMIN_COOKIE = 'veriflow_admin_token'

export const ADMIN_LOGIN_PATH = '/admin/login'

export function hasAdminCookie(value: string | undefined) {
  return Boolean(value && value.length > 20)
}
