// Button visual variants. A fixed value set, so a string enum (ADR-0004):
// use sites bind :variant="ButtonVariant.Secondary" rather than a bare string.
export enum ButtonVariant {
  Primary = "primary",
  Secondary = "secondary",
}
