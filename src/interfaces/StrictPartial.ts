export type StrictPartial<T> = { [P in keyof T]?: T[P] };
