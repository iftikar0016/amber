// @ts-check
// Lifts the store's model out of the captured responses (build time).
// It starts empty: in the first capsule every GET is a plain replay. The repair loop adds
// entities here as interactions need them (a task list that must show a new task, and so on).

/**
 * @param {Array<{method:string, path:string, query:string, status:number, resBody:any, journey:string}>} pristine
 *   GET exchanges captured before any change in their journey
 * @returns {Record<string, any>}
 */
export function liftModel(pristine) {
  void pristine;
  return {};
}
