import exp from 'constants';
import { TS2Famix } from '../src/ts2famix';

const filePaths = ["test_src/Decorators.ts"];
const importer = new TS2Famix();

const fmxRep2 = importer.famixRepFromPath(filePaths);
const jsonOutput = fmxRep2.getJSON();
let parsedModel: Array<any> = JSON.parse(jsonOutput);

const idToElementMap: Map<number, any> = new Map();
function initMapFromModel(model) {
    model.forEach(element => {
        idToElementMap.set(element.id, element);
    });
}

describe('ts2famix', () => {
    initMapFromModel(parsedModel);

    it("should contain a class with the classDec decorator", async () => {
        const decorator = parsedModel.filter(el => (el.FM3 == "FamixTypeScript.Decorator" && el.name == "classDec"))[0];
        expect(decorator.name).toBe("classDec");
        expect(decorator.decoratorType).toBe("Class");
    })

    it("should contain a method with the methodDec decorator", async () => {
        const decorator = parsedModel.filter(el => (el.FM3 == "FamixTypeScript.Decorator" && el.name == "methodDec"))[0];
        expect(decorator.name).toBe("methodDec");
        expect(decorator.decoratorType).toBe("Method");
    })

    it("should contain a getter with the getterDec decorator", async () => {
        const decorator = parsedModel.filter(el => (el.FM3 == "FamixTypeScript.Decorator" && el.name == "getterDec"))[0];
        expect(decorator.name).toBe("getterDec");
        expect(decorator.decoratorType).toBe("GetAccessor");
    })

    it("should contain a setter with the setterDec decorator", async () => {
        const decorator = parsedModel.filter(el => (el.FM3 == "FamixTypeScript.Decorator" && el.name == "setterDec"))[0];
        expect(decorator.name).toBe("setterDec");
        expect(decorator.decoratorType).toBe("SetAccessor");
    })

    it("should contain a property with the propertyDec decorator", async () => {
        const decorator = parsedModel.filter(el => (el.FM3 == "FamixTypeScript.Decorator" && el.name == "propertyDec"))[0];
        expect(decorator.name).toBe("propertyDec");
        expect(decorator.decoratorType).toBe("Property");
    })

    it("should contain a parameterDec with the parameterDec decorator", async () => {
        const decorator = parsedModel.filter(el => (el.FM3 == "FamixTypeScript.Decorator" && el.name == "parameterDec"))[0];
        expect(decorator.name).toBe("parameterDec");
        expect(decorator.decoratorType).toBe("Parameter");
    })
});