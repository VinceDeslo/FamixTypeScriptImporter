import { FamixBaseElement } from "./famix_base_element";
import { Class, ContainerEntity } from "./model/famix";
import { CustomSourceLanguage } from "./model/famix";

export class FamixRepository {
  private elements: Set<FamixBaseElement> = new Set<FamixBaseElement>();
  private famixClasses: Set<Class> = new Set<Class>();
  private idCounter: number = 1;
  private lang: CustomSourceLanguage;
  private static repo: FamixRepository;

  constructor() {
    this.lang = new CustomSourceLanguage(this);
    this.lang.setName("TypeScript");
  }

  public static getFamixRepo(): FamixRepository {
    if (this.repo === undefined) {
      this.repo = new FamixRepository();
    }
    return this.repo;
  }

  public static clearFamixRepo() {
    this.repo = new FamixRepository();
  }

  public createOrGetFamixClass(name: string, isInterface?: boolean): Class {
    let newClass = this.getFamixClass(name);
    if (newClass === undefined) {
      newClass = new Class(this);
      newClass.setName(name.toLowerCase());
      newClass.setIsStub(true);
      if ((isInterface !== undefined) && (isInterface)) {
        newClass.setIsInterface(true);
      }
    }
    return newClass;
  }

  public getFamixClass(name: string): Class | undefined {
    for (const fc of Array.from(this.famixClasses.values())) {
      if (fc.getName().toLowerCase() === name.toLowerCase()) {
        return fc;
      }
    }
    return undefined;
  }

  //Arezoo
  public getFamixElementById(id: number): FamixBaseElement | undefined {
    let element = Array.from(this.elements.values()).find(e => e.id == id);
    return element;
  }

  public getFamixElementByFullyQualifiedName(FullyQualifiedName: string): FamixBaseElement | undefined {

    let allContainerEntity = Array.from(this.elements.values())
      .filter(e => (e as any).constructor.name == 'Method'
        || (e as any).constructor.name == 'Function'
        || (e as any).constructor.name == 'Namespace') as ContainerEntity[];

    let containerEntityElement = allContainerEntity.find(c => c.getFullyQualifiedName() == FullyQualifiedName);
    return containerEntityElement;
  }

  public addElement(element: FamixBaseElement) {
    if (element instanceof Class) {
      this.famixClasses.add(element);
    } else {
      this.elements.add(element);
    }
    element.id = this.idCounter;
    this.idCounter++;
  }

  public getJSON(): string {
    let ret: string = "[";///////
    for (const element of Array.from(this.famixClasses.values())) {
      ret = ret + element.getJSON() + ",";
    }
    for (const element of Array.from(this.elements.values())) {
      ret = ret + element.getJSON() + ",";
    }
    ret = ret.substring(0, ret.length - 1)
    return ret + "]";//////////
  }
}
