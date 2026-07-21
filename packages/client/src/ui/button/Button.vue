<script setup lang="ts">
import { variantClasses } from "./button-config";
import { ButtonVariant } from "./button-variant";

export type ButtonProps = { variant?: ButtonVariant };

const { variant = ButtonVariant.PRIMARY } = defineProps<ButtonProps>();
</script>

<template>
  <button
    class="font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 cursor-pointer"
    :class="variantClasses[variant]"
  >
    <slot />
  </button>
</template>
