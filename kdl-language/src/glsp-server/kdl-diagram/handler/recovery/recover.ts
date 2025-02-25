export interface Recover<T> {
    recover(item: T): Promise<void> | void;
}
