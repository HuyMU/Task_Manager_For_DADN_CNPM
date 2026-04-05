<script setup>
import { useAuth } from './composables/useAuth'

const { isAuthenticated, isAdmin, username, role, logout } = useAuth()
</script>

<template>
  <div class="h-full">
    <div class="max-w-7xl mx-auto p-6 md:p-10">
      <!-- Navbar -->
      <header v-if="isAuthenticated" class="mb-10 flex flex-col md:flex-row md:items-center justify-between border-b border-indigo-100 pb-6 gap-4">
        <div>
          <h1 class="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">Taskboard</h1>
          <p class="text-slate-500 mt-2 font-medium">Manage your team's workflow</p>
        </div>
        
        <nav v-if="isAdmin" class="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/60 shadow-inner">
          <router-link to="/dashboard" class="px-5 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none" active-class="text-indigo-700 bg-white shadow-sm font-bold" inactive-class="text-slate-500 hover:text-slate-700 hover:bg-slate-200/50">
            Kanban Board
          </router-link>
          <router-link to="/settings" class="px-5 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none" active-class="text-indigo-700 bg-white shadow-sm font-bold" inactive-class="text-slate-500 hover:text-slate-700 hover:bg-slate-200/50">
            Workspace Settings
          </router-link>
        </nav>

        <div class="flex items-center gap-4">
          <div class="text-right ml-4 border-l border-slate-200 pl-4 hidden md:block">
            <p class="text-xs text-slate-500">Logged in as</p>
            <p class="font-bold text-indigo-700 leading-tight">{{ username }} ({{ role }})</p>
          </div>
          <button @click="logout" class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors focus:outline-none shrink-0">
            Logout
          </button>
        </div>
      </header>

      <!-- Main Router Outlet -->
      <router-view></router-view>
    </div>
  </div>
</template>
