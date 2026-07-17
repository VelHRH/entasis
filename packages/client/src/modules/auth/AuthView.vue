<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { routeNames } from "../../router";
import { useSessionStore } from "./session.store";
import Button from "../../ui/Button.vue";
import Input from "../../ui/Input.vue";

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
        <Input v-model="email" label="Email" type="email" autocomplete="email" required />
        <Input
          v-model="password"
          label="Password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          required
        />
      </div>

      <p v-if="error" role="alert" class="mt-4 text-sm text-destructive">{{ error }}</p>

      <Button type="submit" :disabled="pending" class="mt-8 w-full">
        {{ mode === "login" ? "Log in" : "Create account" }}
      </Button>

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
