export const pluck : PluckType = (elements , field) => {
    return elements.map(element => element[field]);
};

export type PluckType = (elements: Record<string, string>[], field: string) => string [];

