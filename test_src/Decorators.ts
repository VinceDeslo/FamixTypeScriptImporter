
const classDec = (target) => {
    return;
}

const methodDec = () => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        return;
    };
}

const accessorDec = () => {
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

    @accessorDec()
    get accessor(){
        return this._accessor;
    }

    @methodDec()
    decoratedMethod(@parameterDec param: boolean){
        return;
    }
}

