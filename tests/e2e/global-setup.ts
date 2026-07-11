// Réchauffe le serveur Nuxt dev avant les tests : le tout premier hit sur
// chaque route compile à froid ses chunks Vite (dépendances + pré-bundling),
// ce qui peut déclencher plusieurs rechargements internes et dépasser le
// timeout d'un test individuel — surtout sur un runner CI peu véloce.
// En payant ce coût ici (hors budget de chaque test), les tests réels ne
// voient plus que des navigations déjà compilées.
async function warmUp(url: string, attempts = 3): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // Serveur pas encore prêt — on retente.
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
}

export default async function globalSetup() {
  const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
  const routes = ['/', '/login', '/cockpit', '/trajets', '/trajets/nouvelle-annonce', '/demandes']
  for (const route of routes) {
    await warmUp(`${base}${route}`)
  }
}
