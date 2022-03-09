import { 
  Access,
  Attribute, 
  BehaviouralEntity, 
  Class, 
  ContainerEntity, 
  Method,
  Module, 
  Parameter 
} from ".";
import { FamixJSONExporter } from "../../famix_JSON_exporter";

// Defines the type of models that can be decorated in TypeScript
export type Decorateable = Class| Method | Parameter | Attribute | Access;

export class Decorator extends BehaviouralEntity {

  private decoratorContainer: ContainerEntity;

  // oneMany.Getter
  // @FameProperty(name = "container", opposite = "decorators")
  public getContainer(): ContainerEntity {
    return this.decoratorContainer;
  }

  // oneMany.Setter
  public setContainer(newContainer: ContainerEntity) {
    this.decoratorContainer = newContainer;
    newContainer.getDecorators().add(this);
  }

  private decoratorParentModule: Module;

  // @FameProperty(name = "parentModule")
  public getParentModule(): Module {
    return this.decoratorParentModule;
  }

  // oneMany.Setter
  public setParentModule(decoratorParentModule: Module) {
    this.decoratorParentModule = decoratorParentModule;
  }

  private decoratorType: string;

  // oneMany.Getter
  // @FameProperty(name = "decoratorType")
  public getDecoratorType(): string {
    return this.decoratorType;
  }

  // oneMany.Setter
  public setDecoratorType(value: string) {
    this.decoratorType = value;
  }

  private decoratedEntity: Decorateable;

  // oneMany.Getter
  // @FameProperty(name = "decoratedEntity")
  public getDecoratedEntity(): Decorateable {
    return this.decoratedEntity;
  }

  // oneMany.Setter
  public setDecoratedEntity(value: Decorateable) {
    this.decoratedEntity = value;
  }

  private isFactory: boolean;

  // oneMany.Getter
  // @FameProperty(name = "isFactory")
  public getIsFactory(): boolean {
    return this.isFactory;
  }

  // oneMany.Setter
  public setIsFactory(value: boolean) {
    this.isFactory = value;
  }

  // JSON exporter call
  public getJSON(): string {
    const mse: FamixJSONExporter = new FamixJSONExporter("Decorator", this);
    this.addPropertiesToExporter(mse);
    return mse.getJSON();
  }

  // Append properties to the model
  public addPropertiesToExporter(exporter: FamixJSONExporter) {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("container", this.getContainer());
    exporter.addProperty("parentModule", this.getParentModule());
    exporter.addProperty("decoratorType", this.getDecoratorType());
    exporter.addProperty("decoratedEntity", this.getDecoratedEntity());
    exporter.addProperty("isFactory", this.getIsFactory());
  }

}
