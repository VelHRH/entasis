<script setup lang="ts">
import {
  RouterLink,
  type RouteLocationAsPathGeneric,
  type RouteLocationAsRelativeGeneric,
} from "vue-router";
import { ButtonVariant } from "./button/button-variant";
import type { ButtonProps } from "./button/Button.vue";
import { variantClasses } from "./button/button-config.ts";

const { to } = defineProps<
  ButtonProps & { to: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric }
>();
</script>

<template>
  <RouterLink :to="to" :class="variantClasses[ButtonVariant.LINK]">
    <slot />
  </RouterLink>
</template>
