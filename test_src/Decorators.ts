
const classDec = (target) => {
    return;
}

const methodDec = () => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        return;
    };
}

const getterDec = () => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        return;
    };
}

const setterDec = () => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        return;
    };
}


const propertyDec = (value: string) => {
        return (target: any, propertyKey: string) => {
            return;
        };
}

const parameterDec = (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
    return;
}

@classDec
class SimpleDecoratorClass{
    private _accessor: number;

    @propertyDec("value")
    classProperty: string;

    @getterDec()
    get getAccessor(){
        return this._accessor;
    }

    @setterDec()
    set setAccessor(value: number){
        this._accessor = value;
    }

    @methodDec()
    decoratedMethod(@parameterDec param: boolean){
        return;
    }
}

