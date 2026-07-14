<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSessionStore } from "../stores/session";

const session = useSessionStore();
const router = useRouter();
const route = useRoute();

const mode = ref<"login" | "signup">("login");
const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const pending = ref(false);

const toggleMode = () => {
  mode.value = mode.value === "login" ? "signup" : "login";
  error.value = null;
};

const submit = async () => {
  if (pending.value) return;
  pending.value = true;
  error.value = null;

  const result = mode.value === "login"
    ? await session.login(email.value, password.value)
    : await session.signUp(email.value, password.value);

  pending.value = false;
  if (result.ok) {
    const redirect = route.query.redirect;
    await router.replace(typeof redirect === "string" ? redirect : { name: "home" });
  } else {
    error.value = result.message;
  }
};
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <form class="w-full max-w-sm space-y-4" novalidate @submit.prevent="submit">
      <h1 class="text-center text-2xl font-bold text-gray-900">
        {{ mode === "login" ? "Log in" : "Sign up" }}
      </h1>

      <label class="block">
        <span class="mb-1 block text-sm text-gray-600">Email</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-violet-500 focus:outline-none"
        />
      </label>

      <label class="block">
        <span class="mb-1 block text-sm text-gray-600">Password</span>
        <input
          v-model="password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-violet-500 focus:outline-none"
        />
      </label>

      <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="pending"
        class="w-full rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
      >
        {{ mode === "login" ? "Log in" : "Create account" }}
      </button>

      <button type="button" class="w-full text-sm text-gray-500 hover:text-gray-700" @click="toggleMode">
        {{ mode === "login" ? "No account yet? Sign up" : "Already have an account? Log in" }}
      </button>
    </form>
  </main>
</template>
