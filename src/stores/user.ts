import { useStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

import router from '@/router'
import { resolveMenu, resolveRoute } from '@/router/helper'
import { routeRecordRaw } from '@/router/record'

import type { MenuMixedOptions } from '@/router/helper'
import type { MenuOption } from 'naive-ui'
import type { RouteRecordRaw } from 'vue-router'

interface User {
  avatar?: string
  id?: string
  name?: string
  role?: 'admin' | 'user'
}

const DEFAULT_USER: User = {
  avatar: '',
  id: '2000',
  name: 'Lithe User',
  role: 'admin',
}

export const useUserStore = defineStore('userStore', () => {
  const user = useStorage<User>('user', DEFAULT_USER)

  const token = useStorage<string | null>('token', '')

  const menuList = ref<MenuOption[]>([])

  const routeList = ref<RouteRecordRaw[]>([])

  const setToken = (value: string | null) => {
    token.value = value
  }

  async function resolveMenuList() {
    const res = await new Promise<MenuMixedOptions[]>((resolve) => {
      if (token.value?.includes('admin')) {
        resolve(routeRecordRaw)
      } else {
        const allowedRoutes = ['dashboard', 'dataShow', 'notfoundPage', 'about']
        const filteredRoutes = routeRecordRaw.filter((route) => {
          return !route.type && route.name && allowedRoutes.includes(route.name as string)
        })
        resolve(filteredRoutes)
      }
    })

    menuList.value = resolveMenu(res) || []
    routeList.value = resolveRoute(res) || []
  }

  function cleanup(redirectPath?: string) {
    router.replace({
      name: 'signIn',
      ...(redirectPath ? { query: { r: redirectPath } } : {}),
    })

    token.value = null

    if (router.hasRoute('layout')) {
      router.removeRoute('layout')
    }

    menuList.value = []

    routeList.value = []
  }

  return {
    user,
    token,
    menuList,
    routeList,
    resolveMenuList,
    setToken,
    cleanup,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
