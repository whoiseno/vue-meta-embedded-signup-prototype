<script setup lang="ts">
import FacebookSignupButton from './components/FacebookSignupButton.vue'
</script>

<template>
  <main class="max-w-5xl mx-auto px-4 py-12 space-y-24">
    <section>
      <hgroup class="text-center">
        <h1 class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Vue + Meta Embedded SignUp Prototype
        </h1>
        <p class="text-neutral-400 text-xl">
          This prototype demonstrates how to implement Meta&apos;s Embedded SignUp v4 on a Vue 3
          App.
        </p>
      </hgroup>
    </section>
    <section>
      <div
        class="border border-neutral-200 rounded-sm flex items-center justify-center px-12 py-24"
      >
        <FacebookSignupButton />
      </div>
    </section>
  </main>
</template>
