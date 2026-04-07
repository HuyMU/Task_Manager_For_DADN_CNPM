<script setup lang="ts">
import { useAuth } from './composables/useAuth'
import ThemeToggle from './components/ThemeToggle.vue'

const { isAuthenticated, isAdmin, username, role, logout } = useAuth()
</script>

<template>
  <div class="h-full relative">
    <!-- Global Floating Theme Toggle -->
    <div class="absolute top-4 right-4 z-50">
      <ThemeToggle />
    </div>

    <div class="max-w-7xl mx-auto p-6 md:p-10">
      <!-- Navbar -->
      <header v-if="isAuthenticated" class="mb-10 flex flex-col md:flex-row md:items-center justify-between border-b border-border-color pb-6 gap-4 pr-12">
        <div>
          <h1 class="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">Taskboard</h1>
          <p class="text-text-muted mt-2 font-medium">Manage your team's workflow</p>
        </div>
        
        <nav v-if="isAdmin" class="flex items-center gap-2 bg-surface-bg p-1.5 rounded-xl border border-border-muted shadow-inner">
          <router-link to="/dashboard" class="px-5 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none" active-class="text-indigo-700 dark:text-indigo-300 bg-surface-hover shadow-sm font-bold" inactive-class="text-text-muted hover:text-text-primary hover:bg-surface-hover">
            Kanban Board
          </router-link>
          <router-link to="/settings" class="px-5 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none" active-class="text-indigo-700 dark:text-indigo-300 bg-surface-hover shadow-sm font-bold" inactive-class="text-text-muted hover:text-text-primary hover:bg-surface-hover">
            Workspace Settings
          </router-link>
        </nav>

        <div class="flex items-center gap-4">
          <div class="text-right ml-4 border-l border-border-muted pl-4 hidden md:block">
            <p class="text-xs text-text-muted">Logged in as</p>
            <p class="font-bold text-text-primary leading-tight">{{ username }} <span class="text-text-secondary">({{ role }})</span></p>
          </div>
          <button @click="logout" class="bg-surface-bg border border-border-muted hover:bg-surface-hover text-text-primary px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors focus:outline-none shrink-0">
            Logout
          </button>
        </div>
      </header>

      <!-- Main Router Outlet -->
      <router-view></router-view>
    </div>
  </div>
</template>
