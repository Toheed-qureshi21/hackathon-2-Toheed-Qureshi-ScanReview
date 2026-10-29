"use client";

type AuthModeTabsProps = {
  signup: boolean;
  onSelect: (signup: boolean) => void;
};

export function AuthModeTabs({ signup, onSelect }: AuthModeTabsProps) {
  return (
    <div className="seg" role="tablist" aria-label="Authentication mode">
      <button
        type="button"
        role="tab"
        id="auth-tab-login"
        aria-selected={!signup}
        aria-controls="auth-panel"
        tabIndex={signup ? -1 : 0}
        onClick={() => onSelect(false)}
      >
        Log in
      </button>
      <button
        type="button"
        role="tab"
        id="auth-tab-signup"
        aria-selected={signup}
        aria-controls="auth-panel"
        tabIndex={signup ? 0 : -1}
        onClick={() => onSelect(true)}
      >
        Sign up
      </button>
    </div>
  );
}
