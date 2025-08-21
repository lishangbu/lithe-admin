import { useDiscreteApi } from '@/composable'
import { usePreferencesStore, pinia, useUserStore } from '@/stores'

import type { Router } from 'vue-router'

const Layouts = () => import('@/layouts/index.vue')

const { loadingBar } = useDiscreteApi()

const preferencesStore = usePreferencesStore(pinia)

export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    if (preferencesStore.preferences.showTopLoadingBar) {
      loadingBar.start()
    }

    const userStore = useUserStore()

    if (to.name === 'signIn') {
      if (!userStore.token) {
        next()
      } else {
        next(from.fullPath)
      }

      return false
    }

    if (!userStore.token) {
      userStore.cleanup()
      next()
      return false
    }

    if (userStore.token && !router.hasRoute('layouts')) {
      try {
        await userStore.resolveMenuList()

        router.addRoute({
          path: '/',
          name: 'layouts',
          component: Layouts,
          // if you need to have a redirect when accessing / routing
          redirect: '/dashboard',
          children: userStore.routeList,
        })

        next(to.fullPath)
      } catch (error) {
        console.error('Error resolving user menu or adding route:', error)
        userStore.cleanup()
        next()
      }

      return false
    }

    next()
    return false
  })

  router.beforeResolve((_, __, next) => {
    next()
  })

  router.afterEach(() => {
    if (preferencesStore.preferences.showTopLoadingBar) {
      loadingBar.finish()
    }
  })
}
