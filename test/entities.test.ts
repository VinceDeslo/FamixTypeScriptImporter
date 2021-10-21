import { TS2Famix } from '../src/ts2famix';
import 'jest-extended';

const filePaths = ["resources/Entity.ts"];
const importer = new TS2Famix();

const fmxRep2 = importer.famixRepFromPath(filePaths);
const jsonOutput = fmxRep2.getJSON();
let parsedModel: Array<any>;

const idToElementMap: Map<number, any> = new Map();
function initMapFromModel(model) {
    model.forEach(element => {
        idToElementMap.set(element.id, element);
    });
}

describe('ts2famix', () => {
    it("should generate valid json", async () => {
        parsedModel = JSON.parse(jsonOutput);
        expect(parsedModel).toBeTruthy();
        initMapFromModel(parsedModel);
    });

    it("should generate json with FM3 FamixTypeScript.Class for EntityClass", async () => {
        expect(jsonOutput)
            .toMatch(/"FM3":"FamixTypeScript.Class","id":[1-9]\d*|0,"sourceAnchor":{"ref":[1-9]\d*|0},"name":"EntityClass"/);
    });

    // this test will break when Animal.ts is changed
    // it("model should contain some elements", async () => {
    //     expect(parsedModel.length).toBe(52);
    // });

    it("should contain an Animal class with three methods: move, move2 and constructor", async () => {
        const animalCls = parsedModel.filter(el => (el.FM3 == "FamixTypeScript.Class" && el.name == "EntityClass"))[0];
        expect(animalCls.methods.length).toBe(3);
        let mNames: Set<string> = new Set();
        animalCls.methods.forEach(m => {
            mNames.add(idToElementMap.get(m.ref as number).name)
        });
        expect(mNames.has("move") &&
            mNames.has("move2") &&
            mNames.has("constructor")).toBeTrue();
    });
});
