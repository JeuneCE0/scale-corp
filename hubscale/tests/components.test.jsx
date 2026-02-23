import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import {
  Badge, Btn, Card, KPI, Toggle, HelpTip, ProgressBar, Sparkline,
  ScoreRing, StreakBadge, EmptyState, Inp, Sel, Section, Pagination,
  Spinner, ChecklistItem, AnimatedNumber, NotificationDot, TabBar,
  useToast, ToastContainer,
} from '../src/components/ui.jsx';

describe('Badge component', () => {
  it('renders label text', () => {
    render(<Badge label="Active" color="#22c55e" bg="#22c55e22" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('applies color and background styles', () => {
    const { container } = render(<Badge label="Test" color="#ff0000" bg="#ff000022" />);
    const el = container.firstChild;
    expect(el.style.color).toBe('rgb(255, 0, 0)');
  });
});

describe('Btn component', () => {
  it('renders children text', () => {
    render(<Btn>Click me</Btn>);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Btn onClick={onClick}>Go</Btn>);
    fireEvent.click(screen.getByText('Go'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const onClick = vi.fn();
    render(<Btn onClick={onClick} disabled>No</Btn>);
    const btn = screen.getByText('No');
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies variant styles', () => {
    const { container } = render(<Btn v="danger">Delete</Btn>);
    const btn = container.querySelector('button');
    expect(btn.style.color).toContain('239');
  });

  it('applies small size', () => {
    const { container } = render(<Btn small>Small</Btn>);
    const btn = container.querySelector('button');
    expect(btn.style.fontSize).toBe('11px');
  });
});

describe('Card component', () => {
  it('renders children', () => {
    render(<Card><span>Card content</span></Card>);
    expect(screen.getByText('Card content')).toBeTruthy();
  });

  it('is clickable when onClick is provided', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}><span>Clickable</span></Card>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies accent border', () => {
    const { container } = render(<Card accent="#ff0000"><span>Accent</span></Card>);
    const el = container.firstChild;
    expect(el.style.borderLeft).toContain('rgb(255, 0, 0)');
  });
});

describe('KPI component', () => {
  it('renders label and value', () => {
    render(<KPI label="Revenue" value="12,500€" />);
    expect(screen.getByText('Revenue')).toBeTruthy();
    expect(screen.getByText('12,500€')).toBeTruthy();
  });

  it('renders sub text when provided', () => {
    render(<KPI label="CA" value="10K" sub="+15% vs N-1" />);
    expect(screen.getByText('+15% vs N-1')).toBeTruthy();
  });

  it('renders icon when provided', () => {
    render(<KPI label="Test" value="42" icon="💰" />);
    expect(screen.getByText('💰')).toBeTruthy();
  });
});

describe('Toggle component', () => {
  it('renders label', () => {
    render(<Toggle on={false} onToggle={() => {}} label="Dark mode" />);
    expect(screen.getByText('Dark mode')).toBeTruthy();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<Toggle on={false} onToggle={onToggle} label="Toggle" />);
    fireEvent.click(screen.getByText('Toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard activation', () => {
    const onToggle = vi.fn();
    render(<Toggle on={true} onToggle={onToggle} label="KB" />);
    const el = screen.getByRole('switch');
    fireEvent.keyDown(el, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('ProgressBar component', () => {
  it('renders without errors', () => {
    const { container } = render(<ProgressBar value={50} max={100} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('clamps width between 0 and 100', () => {
    const { container } = render(<ProgressBar value={150} max={100} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('100%');
  });
});

describe('Sparkline component', () => {
  it('renders SVG with data', () => {
    const { container } = render(<Sparkline data={[10, 20, 30, 40]} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('returns null with insufficient data', () => {
    const { container } = render(<Sparkline data={[10]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('ScoreRing component', () => {
  it('renders SVG ring', () => {
    const { container } = render(<ScoreRing score={75} size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders children when provided', () => {
    render(<ScoreRing score={50}><span>50%</span></ScoreRing>);
    expect(screen.getByText('50%')).toBeTruthy();
  });
});

describe('StreakBadge component', () => {
  it('renders with count', () => {
    render(<StreakBadge count={5} />);
    expect(screen.getByText('5 mois')).toBeTruthy();
  });

  it('returns null with no count', () => {
    const { container } = render(<StreakBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('EmptyState component', () => {
  it('renders title and sub', () => {
    render(<EmptyState title="No data" sub="Add some items" icon="📭" />);
    expect(screen.getByText('No data')).toBeTruthy();
    expect(screen.getByText('Add some items')).toBeTruthy();
    expect(screen.getByText('📭')).toBeTruthy();
  });
});

describe('Inp component', () => {
  it('renders with label', () => {
    render(<Inp label="Email" value="" onChange={() => {}} />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('calls onChange on input', () => {
    const onChange = vi.fn();
    render(<Inp label="Name" value="" onChange={onChange} placeholder="Enter name" />);
    const input = screen.getByPlaceholderText('Enter name');
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(onChange).toHaveBeenCalledWith('Alice');
  });

  it('renders textarea when textarea prop is true', () => {
    const { container } = render(<Inp textarea value="hello" onChange={() => {}} />);
    const ta = container.querySelector('textarea');
    expect(ta).toBeTruthy();
    expect(ta.value).toBe('hello');
  });
});

describe('Sel component', () => {
  it('renders options', () => {
    const options = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ];
    render(<Sel label="Choose" value="a" onChange={() => {}} options={options} />);
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('calls onChange on selection', () => {
    const onChange = vi.fn();
    const options = [{ value: 'x', label: 'X' }, { value: 'y', label: 'Y' }];
    render(<Sel value="x" onChange={onChange} options={options} />);
    fireEvent.change(screen.getByDisplayValue('X'), { target: { value: 'y' } });
    expect(onChange).toHaveBeenCalledWith('y');
  });
});

describe('Section component', () => {
  it('renders title and children', () => {
    render(<Section title="TEST" sub="Description"><p>Content</p></Section>);
    expect(screen.getByText('TEST')).toBeTruthy();
    expect(screen.getByText('Description')).toBeTruthy();
    expect(screen.getByText('Content')).toBeTruthy();
  });
});

describe('Pagination component', () => {
  it('renders page info', () => {
    render(<Pagination page={2} totalPages={5} onChange={() => {}} />);
    expect(screen.getByText('2 / 5')).toBeTruthy();
  });

  it('returns null for single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('disables prev on first page', () => {
    render(<Pagination page={1} totalPages={3} onChange={() => {}} />);
    const prevBtn = screen.getByLabelText('Page précédente');
    expect(prevBtn.disabled).toBe(true);
  });

  it('calls onChange with correct page', () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Page suivante'));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});

describe('Spinner component', () => {
  it('renders with loading role', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
});

describe('ChecklistItem component', () => {
  it('renders label', () => {
    render(<ChecklistItem done={false} label="Do something" />);
    expect(screen.getByText('Do something')).toBeTruthy();
  });

  it('shows checkmark when done', () => {
    render(<ChecklistItem done={true} label="Done item" />);
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ChecklistItem done={false} label="Click me" onClick={onClick} />);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('NotificationDot component', () => {
  it('renders count', () => {
    render(<NotificationDot count={3} />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('shows 9+ for large counts', () => {
    render(<NotificationDot count={15} />);
    expect(screen.getByText('9+')).toBeTruthy();
  });

  it('returns null for zero count', () => {
    const { container } = render(<NotificationDot count={0} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('TabBar component', () => {
  it('renders all items', () => {
    render(<TabBar items={['A', 'B', 'C']} active="A" onChange={() => {}} />);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.getByText('C')).toBeTruthy();
  });

  it('calls onChange when clicking tab', () => {
    const onChange = vi.fn();
    render(<TabBar items={['X', 'Y']} active="X" onChange={onChange} />);
    fireEvent.click(screen.getByText('Y'));
    expect(onChange).toHaveBeenCalledWith('Y');
  });

  it('displays counts when provided', () => {
    render(<TabBar items={['Users']} active="Users" onChange={() => {}} counts={{ Users: 42 }} />);
    expect(screen.getByText('Users (42)')).toBeTruthy();
  });
});

describe('useToast hook + ToastContainer', () => {
  it('adds and displays toasts', async () => {
    function TestComponent() {
      const { toasts, add } = useToast();
      return (
        <div>
          <button onClick={() => add('Hello!', 'success')}>Add Toast</button>
          <ToastContainer toasts={toasts} />
        </div>
      );
    }
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Add Toast'));
    expect(screen.getByText('Hello!')).toBeTruthy();
  });

  it('shows multiple toasts', () => {
    function TestComponent() {
      const { toasts, add } = useToast();
      return (
        <div>
          <button onClick={() => { add('First', 'success'); add('Second', 'error'); }}>Add</button>
          <ToastContainer toasts={toasts} />
        </div>
      );
    }
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
  });

  it('ToastContainer renders nothing when empty', () => {
    const { container } = render(<ToastContainer toasts={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('HelpTip component', () => {
  it('renders the ? icon', () => {
    const { container } = render(<HelpTip text="Some help" />);
    expect(container.querySelector('[aria-label="Some help"]')).toBeTruthy();
  });
});

describe('AnimatedNumber component', () => {
  it('renders value with prefix and suffix', () => {
    render(<AnimatedNumber value={42} prefix="$" suffix="K" />);
    expect(screen.getByText('$42K')).toBeTruthy();
  });
});
