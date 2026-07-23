export const Switch = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
  <button
    disabled={disabled}
    onClick={onChange}
    className={`sd-switch ${checked ? "on" : ""}`}
    style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    aria-pressed={checked}
  />
);
