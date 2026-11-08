/** Shared helpers for screen tests: providers, fetch stub, text queries. */
import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme';

export type Tree = ReactTestRenderer.ReactTestRenderer;
export interface Req {
  method: string;
  url: string;
  body?: any;
}
type Handler = (req: Req) => { status?: number; body: unknown } | undefined;

/** Stubs `fetch`; the first handler returning a reply wins, otherwise `[]`. */
export function stubFetch(handler: Handler): Req[] {
  const requests: Req[] = [];
  globalThis.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    const req: Req = {
      method: init?.method ?? 'GET',
      url,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    requests.push(req);
    const reply = handler(req) ?? { body: [] };
    const status = reply.status ?? 200;
    return {
      ok: status < 300,
      status,
      text: async () => JSON.stringify(reply.body),
    } as Response;
  }) as unknown as typeof fetch;
  return requests;
}

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export const flush = () => act(async () => new Promise<void>(resolve => setTimeout(() => resolve(), 20)));

let client: QueryClient | undefined;
const mounted: Tree[] = [];

/** Call in `afterEach`: unmounts rendered screens and drops the query cache (no open timers). */
export async function clearClient() {
  while (mounted.length) {
    const tree = mounted.pop()!;
    await act(async () => tree.unmount());
  }
  client?.clear();
}

export async function renderScreen(element: React.ReactElement): Promise<Tree> {
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  let tree!: Tree;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <QueryClientProvider client={client!}>
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={metrics}>{element}</SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    );
  });
  mounted.push(tree);
  await flush();
  return tree;
}

const flatten = (children: unknown): string =>
  [children]
    .flat(Infinity)
    .map(c =>
      typeof c === 'string' || typeof c === 'number'
        ? String(c)
        : c && typeof c === 'object' && 'props' in c
        ? flatten((c as { props: { children?: unknown } }).props.children)
        : '',
    )
    .join('');

export const texts = (tree: Tree) =>
  tree.root
    .findAllByType(Text)
    .map(n => flatten(n.props.children))
    .join('\n');

/** Innermost pressable whose subtree contains a Text equal to `text`. */
export async function press(tree: Tree, text: string, index = 0) {
  const nodes = tree.root.findAll(
    n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => flatten(t.props.children) === text),
  );
  // findAll returns outer nodes first; keep the innermost per match.
  const inner = nodes.filter(n => !nodes.some(m => m !== n && n.findAll(x => x === m).length > 0));
  const node = inner[index];
  if (!node) throw new Error(`No pressable with text "${text}"`);
  await act(async () => node.props.onPress());
}

export async function pressLabel(tree: Tree, label: string) {
  const node = tree.root.findAll(n => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label)[0];
  if (!node) throw new Error(`No pressable labelled "${label}"`);
  await act(async () => node.props.onPress());
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Local `YYYY-MM-DDTHH:mm:00`, `daysFromNow` days away. */
export function at(daysFromNow: number, hh: number, mm = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hh)}:${pad(mm)}:00`;
}
