export const Switch = ({ checked, onChange, disabled, label }: { checked: boolean; onChange: () => void; disabled?: boolean; label?: string }) => (
  <button
    type="button"
    role="switch"
    disabled={disabled}
    onClick={onChange}
    aria-label={label}
    aria-checked={checked}
    aria-pressed={checked}
    className={`sd-switch ${checked ? "on" : ""}`}
    style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
  />
);
