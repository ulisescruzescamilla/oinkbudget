import { cn } from './cn';

describe('cn', () => {
  it('drops falsy fragments', () => {
    expect(cn('flex-row', false, null, undefined, 'gap-2')).toBe('flex-row gap-2');
  });

  it('lets a later color override the default text color', () => {
    expect(cn('font-body text-text', 'text-[12px] font-semi text-danger')).toBe('text-[12px] font-semi text-danger');
  });

  it('keeps a font size alongside a text color', () => {
    expect(cn('text-text text-2xs', 'text-muted')).toBe('text-2xs text-muted');
  });

  it('keeps border width and border color together', () => {
    expect(cn('border border-border-2', 'border-2')).toBe('border-border-2 border-2');
  });

  it('lets a later background override an earlier one', () => {
    expect(cn('bg-card', 'bg-card-2')).toBe('bg-card-2');
  });
});
