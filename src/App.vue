<script setup lang="ts">
import FacebookIcon from './components/FacebookIcon.vue'
</script>

<template>
  <main class="max-w-5xl mx-auto px-4 py-12 space-y-8">
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
        class="bg-neutral-50 border-[1px] border-neutral-200 flex items-center justify-center p-12"
      >
        <button
          type="button"
          class="focus-visible:border-blue-500 focus-visible:ring-blue-500/50 rounded-md border border-transparent bg-clip-padding text-base font-medium focus-visible:ring-3 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none select-none bg-neutral-200 text-neutral-900 hover:bg-neutral-200/80"
        >
          <FacebookIcon /> in with Facebook
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped></style>
