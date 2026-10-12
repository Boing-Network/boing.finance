import React from 'react';

/**
 * Shared page layout wrapper for consistent structure across Swap, Bridge, Analytics, Portfolio.
 */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-lg sm:text-xl max-w-2xl"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex flex-wrap gap-2 shrink-0">{children}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Card wrapper with consistent styling.
 */
export function PageCard({ children, className = '', quiet = false, ...props }) {
  return (
    <div
      className={`td-card ${quiet ? 'td-card--quiet' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Standard content width + horizontal padding for feature pages (matches footer shell).
 */
export function AppPageShell({ children, className = '' }) {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] ${className}`}>
      {children}
    </div>
  );
}

const SHELL_WIDTH = {
  narrow: 'td-shell--narrow',
  medium: 'td-shell--medium',
  wide: 'td-shell--wide',
  full: 'td-shell--full',
};

/**
 * Trade & Deploy page shell — consistent padding and max-width.
 * @param {'narrow'|'medium'|'wide'|'full'} [width='medium']
 */
export function TradeDeployShell({ children, width = 'medium', className = '' }) {
  return (
    <div className={`relative z-10 td-shell ${SHELL_WIDTH[width] || SHELL_WIDTH.medium} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Trade & Deploy page hero — eyebrow, title, one supporting line, optional actions.
 */
export function TradeDeployHero({
  eyebrow = 'Trade & Deploy',
  title,
  subtitle,
  align = 'center',
  actions,
  children,
  className = '',
}) {
  return (
    <header className={`td-hero ${align === 'center' ? 'td-hero--center' : ''} ${className}`}>
      {eyebrow ? <span className="td-hero__eyebrow">{eyebrow}</span> : null}
      <h1 className="td-hero__title">{title}</h1>
      {subtitle ? <p className="td-hero__subtitle">{subtitle}</p> : null}
      {actions ? <div className="td-hero__actions">{actions}</div> : null}
      {children}
    </header>
  );
}

/**
 * Status / info banner for Trade & Deploy flows.
 * @param {'info'|'success'|'warn'|'locked'|'neutral'} [variant='neutral']
 */
export function StatusBanner({
  variant = 'neutral',
  title,
  children,
  className = '',
  actions,
  ...props
}) {
  const variantClass =
    variant === 'info'
      ? 'td-status--info'
      : variant === 'success'
        ? 'td-status--success'
        : variant === 'warn'
          ? 'td-status--warn'
          : variant === 'locked'
            ? 'td-status--locked'
            : '';

  return (
    <div
      className={`td-status ${variantClass} ${className}`}
      role="status"
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {title ? <p className="td-status__title">{title}</p> : null}
          {children ? <div>{children}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}

/**
 * Horizontal step rail for guided Trade & Deploy flows.
 * steps: [{ id, label }]
 */
export function StepRail({
  steps = [],
  currentId,
  onStepClick,
  className = '',
  hideDoneLabel = false,
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentId)
  );

  return (
    <nav aria-label="Progress" className={`td-step-rail ${className}`}>
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const clickable = Boolean(onStepClick) && done;
        const stateClass = active ? 'td-step--active' : done ? 'td-step--done' : '';

        return (
          <React.Fragment key={step.id}>
            {index > 0 ? (
              <div
                className={`td-step__connector ${done || active ? 'td-step__connector--done' : ''}`}
                aria-hidden="true"
              />
            ) : null}
            <button
              type="button"
              className={`td-step ${stateClass} ${clickable ? 'td-step--clickable' : ''}`}
              onClick={clickable ? () => onStepClick(step.id) : undefined}
              disabled={!clickable}
              aria-current={active ? 'step' : undefined}
            >
              <span className="td-step__dot">{done && !hideDoneLabel ? '✓' : index + 1}</span>
              <span className="td-step__label">{step.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Segmented control for mode toggles (e.g. Standard / Dynamic mint).
 */
export function SegmentedControl({ options = [], value, onChange, className = '', 'aria-label': ariaLabel }) {
  return (
    <div className={`td-segmented ${className}`} role="tablist" aria-label={ariaLabel || 'Options'}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`td-segmented__btn ${active ? 'td-segmented__btn--active' : ''}`}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function TradeDeployButton({
  variant = 'primary',
  className = '',
  as: Comp = 'button',
  children,
  ...props
}) {
  const variantClass =
    variant === 'green'
      ? 'td-btn--green'
      : variant === 'ghost'
        ? 'td-btn--ghost'
        : variant === 'link'
          ? 'td-btn--link'
          : 'td-btn--primary';

  return (
    <Comp className={`td-btn ${variantClass} ${className}`} {...props}>
      {children}
    </Comp>
  );
}

const PageLayout = {
  PageHeader,
  PageCard,
  AppPageShell,
  TradeDeployShell,
  TradeDeployHero,
  StatusBanner,
  StepRail,
  SegmentedControl,
  TradeDeployButton,
};
export default PageLayout;
