<script setup lang="ts">
import { ButtonVariant } from "./button";

// type, disabled, click handlers, and layout classes (w-full, …) fall
// through to the <button> root as attrs.
const { variant = ButtonVariant.Primary } = defineProps<{ variant?: ButtonVariant }>();
</script>

<template>
  <button
    class="rounded-md px-4 py-2.5 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 cursor-pointer"
    :class="
      variant === ButtonVariant.Primary
        ? 'bg-primary text-primary-foreground hover:shadow-glow active:scale-[0.98]'
        : 'border border-border bg-secondary text-secondary-foreground hover:bg-accent'
    "
  >
    <slot />
  </button>
</template>
