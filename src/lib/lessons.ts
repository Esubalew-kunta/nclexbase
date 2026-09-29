/** Pads a short list of real lesson titles to the catalog lesson count. */
export function padLessons(titles: string[], count: number, prefix: string) {
  return Array.from({ length: count }, (_, i) => titles[i] ?? `${prefix} Lesson ${i + 1}`);
}
