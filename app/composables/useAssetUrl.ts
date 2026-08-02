export function useAssetUrl(path: string) {
  const config = useRuntimeConfig()
  const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
  return `${base}${path.replace(/^\//, '')}`
}
