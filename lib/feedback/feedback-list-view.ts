export type FeedbackListViewState =
  | "loading"
  | "error"
  | "onboarding"
  | "empty"
  | "empty-search"
  | "ready";

export function resolveFeedbackListView(input: {
  userLoading: boolean;
  userError: boolean;
  hasMembership: boolean;
  isLoading: boolean;
  isError: boolean;
  itemCount: number;
  hasSearch: boolean;
}): FeedbackListViewState {
  if (input.userLoading) {
    return "loading";
  }
  if (input.userError) {
    return "error";
  }
  if (!input.hasMembership) {
    return "onboarding";
  }
  if (input.isLoading) {
    return "loading";
  }
  if (input.isError) {
    return "error";
  }
  if (input.itemCount === 0) {
    return input.hasSearch ? "empty-search" : "empty";
  }
  return "ready";
}
