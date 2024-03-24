export default class LocalStorageManager {
    constructor(itemKey, fallBackValue) {
        this.key = itemKey;
        this.fallBackValue = fallBackValue;
    }

    get() {
        return localStorage.getItem(this.key) ?? this.fallBackValue;
    }

    set(value) {
        localStorage.setItem(this.key, value);
    }
}