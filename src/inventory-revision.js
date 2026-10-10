// Content revisions exclude clocks and resource balances. These view-local
// counters also detect direct edits made by the developer tools or legacy saves.
export function createInventoryRevision() {
  let signature, revision = 0;
  return contents => {
    const next = JSON.stringify(contents);
    if (next !== signature) { signature = next; revision++; }
    return revision;
  };
}
