/**
 * Quick login buttons are for the demo only. They show on localhost, and on a hosted demo
 * only when DEMO_QUICK_LOGIN is "true". Read at request time, so the variable can stay server-side.
 */
export function quickLoginAllowed() {
  return process.env.NODE_ENV === "development" || process.env.DEMO_QUICK_LOGIN === "true";
}
