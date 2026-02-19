<script setup lang="ts">
import { ref } from 'vue'
import FacebookSignUp from './components/FacebookSignUp.vue'

const configId = ref<string | undefined>(import.meta.env.VITE_META_CONFIG_ID)
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
        class="bg-neutral-50 border border-neutral-200 rounded-sm flex items-center justify-center px-12 py-24"
      >
        <FacebookSignUp
          :config-id="configId"
          @success="(data) => console.log('Signup successful:', data)"
          @error="(err) => console.error('Signup error:', err)"
          @cancel="() => console.log('Signup cancelled by user')"
        />
      </div>
    </section>
    <section>
      <h2 class="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0">Notes</h2>
      <ul class="list-disc list-inside space-y-2 text-neutral-400">
        <li>
          The <code>configId</code> is read from an environment variable for flexibility. Make sure
          to set <code>VITE_META_CONFIG_ID</code> in your <code>.env</code> file with your actual
          Meta configuration ID.
        </li>
        <li>
          The component emits three events: <code>success</code>, <code>error</code>, and{' '}
          <code>cancel</code>. You can listen to these events to handle the respective outcomes of
          the signup process.
        </li>
        <li>
          Ensure that you have the Facebook SDK properly loaded and initialized in your project for
          the component to function correctly. The SDK should be included in your HTML or loaded
          asynchronously as needed.
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped></style>
