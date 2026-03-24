// Async boundary — same pattern as the React remotes.
// All Angular + zone.js initialisation happens inside bootstrap.ts,
// so the shell's module graph is never blocked by Angular's startup cost.
import('./bootstrap');
