<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { RouteName, routeName } from "@/router";
import { useSessionStore } from "./session.store";
import Button from "@/ui/button/Button.vue";
import { ButtonVariant } from "@/ui/button/button-variant";
import Input from "@/ui/Input.vue";

enum AuthMode {
  Login = "login",
  Signup = "signup",
}

const session = useSessionStore();
const router = useRouter();
const route = useRoute();

const mode = ref<AuthMode>(AuthMode.Login);
const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const pending = ref(false);

const toggleMode = () => {
  mode.value = mode.value === AuthMode.Login ? AuthMode.Signup : AuthMode.Login;
  error.value = null;
};

const submit = async () => {
  if (pending.value) return;
  pending.value = true;
  error.value = null;

  const result =
    mode.value === AuthMode.Login
      ? await session.login(email.value, password.value)
      : await session.signUp(email.value, password.value);

  pending.value = false;
  if (result.ok) {
    const redirect = route.query.redirect;
    await router.replace(
      typeof redirect === "string" ? redirect : { name: routeName(RouteName.ROOMS) },
    );
  } else {
    error.value = result.message;
  }
};
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center px-6 py-16">
    <form class="w-full max-w-sm" novalidate @submit.prevent="submit">
      <h1 class="font-medium">
        {{ mode === AuthMode.Login ? "Log in" : "Sign up" }}
      </h1>
      <p class="mt-2 text-caption text-muted-foreground">
        {{ mode === AuthMode.Login ? "The night is waiting." : "One account, every night." }}
      </p>

      <div class="mt-10 space-y-5">
        <Input v-model="email" label="Email" type="email" autocomplete="email" required />
        <Input
          v-model="password"
          label="Password"
          type="password"
          :autocomplete="mode === AuthMode.Login ? 'current-password' : 'new-password'"
          required
        />
      </div>

      <p v-if="error" role="alert" class="mt-4 text-caption text-destructive">{{ error }}</p>

      <Button type="submit" :disabled="pending" class="mt-8 w-full">
        {{ mode === AuthMode.Login ? "Log in" : "Create account" }}
      </Button>

      <Button
        type="button"
        :variant="ButtonVariant.LINK"
        class="mt-6 block w-full text-center"
        @click="toggleMode"
      >
        {{
          mode === AuthMode.Login ? "No account yet? Sign up" : "Already have an account? Log in"
        }}
      </Button>
    </form>
  </main>
</template>
