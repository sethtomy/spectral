import URI from 'urijs';

class ExtendedURI extends URI {
    constructor(_value) {
        super(_value);
        this._value = _value;
    }
    get length() {
        return this._value.length;
    }
}

export { ExtendedURI };
