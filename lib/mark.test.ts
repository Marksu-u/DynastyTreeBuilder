import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { markSvg } from './mark';

describe('markSvg', () => {
  it('matches the static app/icon.svg byte for byte', () => {
    const onDisk = readFileSync(path.join(process.cwd(), 'app/icon.svg'), 'utf8');
    expect(onDisk.trim()).toBe(markSvg().trim());
  });

  it('scales by width and height only, keeping the 32-unit grid', () => {
    expect(markSvg(512)).toContain('width="512" height="512"');
    expect(markSvg(512)).toContain('viewBox="0 0 32 32"');
  });

  it('drops only the tile when asked, leaving every glyph in place', () => {
    const untiled = markSvg(180, { tile: false });
    expect(untiled).not.toContain('<rect');
    // The founder, both heirs and the junction all survive.
    expect(untiled.match(/<path|<circle/g)).toHaveLength(5);
  });
});
