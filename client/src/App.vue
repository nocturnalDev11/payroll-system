<script setup lang="ts">
import AppContainer from './Layouts/AppContainer.vue';
import AppHeader from './Layouts/AppHeader.vue';
import AppFooter from './Layouts/AppFooter.vue';
</script>

<template>
  <app-container>
    <app-header />
    <main class="flex flex-col items-center py-8 px-4">
      <router-view :key="$route.path"></router-view>
    </main>
    <app-footer />
  </app-container>
</template>