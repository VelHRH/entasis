<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { routeNames } from "../../router";
import { useSessionStore } from "./session.store";

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

  const result =
    mode.value === "login"
      ? await session.login(email.value, password.value)
      : await session.signUp(email.value, password.value);

  pending.value = false;
  if (result.ok) {
    const redirect = route.query.redirect;
    await router.replace(typeof redirect === "string" ? redirect : { name: routeNames.home });
  } else {
    error.value = result.message;
  }
};
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center px-6 py-16">
    <form class="w-full max-w-sm" novalidate @submit.prevent="submit">
      <h1 class="text-3xl font-medium">
        {{ mode === "login" ? "Log in" : "Sign up" }}
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ mode === "login" ? "The night is waiting." : "One account, every night." }}
      </p>

      <div class="mt-10 space-y-5">
        <label class="block">
          <span class="mb-2 block text-sm text-muted-foreground">Email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-sm text-muted-foreground">Password</span>
          <input
            v-model="password"
            type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            required
            class="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
      </div>

      <p v-if="error" role="alert" class="mt-4 text-sm text-destructive">{{ error }}</p>

      <button
        type="submit"
        :disabled="pending"
        class="mt-8 w-full rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground transition hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:opacity-50"
      >
        {{ mode === "login" ? "Log in" : "Create account" }}
      </button>

      <button
        type="button"
        class="mt-4 w-full text-sm text-muted-foreground transition hover:text-foreground"
        @click="toggleMode"
      >
        {{ mode === "login" ? "No account yet? Sign up" : "Already have an account? Log in" }}
      </button>
    </form>
  </main>
</template>
