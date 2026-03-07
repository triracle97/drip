import type { Category } from '@/store';

export function buildCatMap(categories: Category[]): Record<string, Category> {
    const m: Record<string, Category> = {};
    categories.forEach(c => { m[c.id] = c; });
    return m;
}

export function catColor(catMap: Record<string, Category>, id: string): string {
    return catMap[id]?.color ?? '#8E8E93';
}

export function catName(catMap: Record<string, Category>, id: string): string {
    return catMap[id]?.name ?? 'Other';
}
