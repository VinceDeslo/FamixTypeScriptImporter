import {
    ClassDeclaration, ConstructorDeclaration, FunctionDeclaration, Identifier, InterfaceDeclaration
    , MethodDeclaration, MethodSignature, ModuleDeclaration, ModuleDeclarationKind, Project, PropertyDeclaration, PropertySignature, SourceFile, StructureKind, VariableDeclaration, Decorator, ParameterDeclaration, GetAccessorDeclaration, SetAccessorDeclaration
} from "ts-morph";
import * as Famix from "./lib/famix/src/model/famix";
import { FamixRepository } from "./lib/famix/src/famix_repository";
import { getSyntaxKindName, ModuleKind, StandardizedFilePath, SyntaxKind } from "@ts-morph/common";
import { number, string } from "yargs";
import { Interface } from "readline";

const cyclomatic = require('./lib/ts-complex/cyclomatic-service');

/**
 * Main Importer definition
 */
export class TS2Famix {

    private readonly fmxNamespacesMap = new Map<string, Famix.Namespace>();
    private fmxRep = new FamixRepository();
    private fmxTypes = new Map<string, Famix.Type>();
    private allClasses = new Array<ClassDeclaration>();
    private allInterfaces = Array<InterfaceDeclaration>();
    private arrayOfAccess = new Map<number, any>(); // id of famix object(variable,attribute) and ts-morph object
    private arrayOfInvocation = new Map<number, any>(); // id of famix object(method) and ts-morph object

    private currentCC: any; // store cc metrics for current file

    /**
     * Generates a FAMIX Repo from provided source files (-i)
     */
    famixRepFromPath(paths: Array<string>) {
        try {
            // Generate project
            console.info(`paths = ${paths}`);
            const project = new Project();
            const sourceFiles = project.addSourceFilesAtPaths(paths);

            console.info("Source files:")
            // Generate File anchor and Modules for each source file
            sourceFiles.forEach(file => {
                console.info(`> ${file.getBaseName()}`);

                this.makeFamixIndexFileAnchor(file.getFilePath(), file.getStart(), file.getEnd(), null);

                this.currentCC = cyclomatic.calculate(file.getFilePath());

                let currentModules: ModuleDeclaration[] = file.getModules();
                console.info("Module(s):")
                if (currentModules.length > 0) {
                    this.readNamespace(currentModules, file.getFilePath(), null);
                }
                this.readNamespace(file, file.getFilePath(), null);
            });

            // Generate Array of Structural entities
            this.arrayOfAccess.forEach((value, key) => {
                console.log(`  Access(es) to ${value.getName()}:`);
                let famixStructuralElement = this.fmxRep.getFamixElementById(key) as Famix.StructuralEntity;
                let nodes = value.findReferencesAsNodes() as Array<Identifier>;
                nodes.forEach(node => {
                    console.log(`    ${node.getSymbol().getName()}`);
                    let scopeDeclaration = node.getAncestors()
                        .find(a => a.getKind() == SyntaxKind.MethodDeclaration
                            || a.getKind() == SyntaxKind.Constructor
                            || a.getKind() == SyntaxKind.FunctionDeclaration
                            //|| a.getKind() == SyntaxKind.SourceFile
                            //|| a.getKind() == SyntaxKind.ModuleDeclaration
                        );//////////for global variable it must work

                    // let accessor = this.fmxRep.getFamixElementby(scopeDeclaration.getSourceFile().getFilePath()
                    //     , scopeDeclaration.getStart()) as Famix.BehaviouralEntity;
                    // let fmxAccess = new Famix.Access(this.fmxRep);
                    // fmxAccess.setAccessor(accessor);
                    // fmxAccess.setVariable(famixStructuralElement);
                    if (scopeDeclaration) {
                        let fullyQualifiedName = scopeDeclaration.getSymbol().getFullyQualifiedName()
                        let accessor = this.fmxRep.getFamixElementByFullyQualifiedName(fullyQualifiedName) as Famix.BehaviouralEntity;
                        console.log(`        Creating Famix.Access with accessor: ${accessor.getName()} and variable: ${famixStructuralElement.getName()}`);
                        let fmxAccess = new Famix.Access(this.fmxRep);
                        fmxAccess.setAccessor(accessor);
                        fmxAccess.setVariable(famixStructuralElement);

                        this.makeFamixIndexFileAnchor(node.getSourceFile().getFilePath(), node.getStart(), node.getEnd(), fmxAccess);
                    } else {
                        console.log(`---error--- Scope declaration is invalid for ${node.getSymbol().getFullyQualifiedName()}. Continuing parse...`);
                    }
                });
            });
            console.log(`Creating invocations:`);

            // Generate Array of Behavioural entities
            this.arrayOfInvocation.forEach((value, key) => {
                console.log(`  Invocation(s) to ${value.getName()}:`);
                let famixBehaviouralElement = this.fmxRep.getFamixElementById(key) as Famix.BehaviouralEntity;
                let nodes = value.findReferencesAsNodes() as Array<Identifier>;
                nodes.forEach(node => {
                    let scopeDeclaration = node.getAncestors()
                        .find(a => a.getKind() == SyntaxKind.MethodDeclaration
                            || a.getKind() == SyntaxKind.Constructor
                            || a.getKind() == SyntaxKind.FunctionDeclaration
                            //|| a.getKind() == SyntaxKind.SourceFile
                        );//////////for global variable it must work
                    if (scopeDeclaration) {
                        let fullyQualifiedName = scopeDeclaration.getSymbol().getFullyQualifiedName()
                        let receiver = this.fmxRep.getFamixElementByFullyQualifiedName(fullyQualifiedName) as Famix.BehaviouralEntity;
                        let fmxInvovation = new Famix.Invocation(this.fmxRep);
                        fmxInvovation.setReceiver(receiver);
                        fmxInvovation.setSender(famixBehaviouralElement);

                        this.makeFamixIndexFileAnchor(node.getSourceFile().getFilePath(), node.getStart(), node.getEnd(), fmxInvovation);
                    } else {
                        console.error(`---error--- scopeDeclaration invalid for ${node.getSymbol().getFullyQualifiedName()}. Continuing parse...`);
                    }

                });
            });
            
            // Get Inheritance structure for all Classes 
            this.allClasses.forEach(cls => {
                const baseClass = cls.getBaseClass();
                if (baseClass !== undefined) {
                    const fmxInheritance = new Famix.Inheritance(this.fmxRep);
                    const subClass = this.fmxTypes.get(cls.getName());
                    const superClass = this.fmxTypes.get(baseClass.getName());
                    fmxInheritance.setSubclass(subClass);
                    fmxInheritance.setSuperclass(superClass);
                }

                const interfaces = cls.getImplements();
                interfaces.forEach(inter => {
                    if (!inter.getType().getText().endsWith('>')) { // ignore generics
                        const fmxImplements = new Famix.Inheritance(this.fmxRep);
                        const completeName = inter.getText();
                        const fmxSuperInter = this.fmxTypes.get(completeName.substring(completeName.lastIndexOf('.') + 1));
                        const subImplements = this.fmxTypes.get(cls.getName());
                        fmxImplements.setSuperclass(fmxSuperInter);
                        fmxImplements.setSubclass(subImplements);
                    }
                });
            });

            // Get Inheritance structure for all Interfaces 
            this.allInterfaces.forEach(inter => {
                const baseInter = inter.getBaseTypes()[0];
                if (baseInter !== undefined && baseInter.getText() !== 'Object') {
                    const fmxInher = new Famix.Inheritance(this.fmxRep);
                    const sub = this.fmxTypes.get(inter.getName());
                    const completeName = baseInter.getText();
                    const fmxSuper = this.fmxTypes.get(completeName.substring(completeName.lastIndexOf('.') + 1));
                    fmxInher.setSubclass(sub);
                    fmxInher.setSuperclass(fmxSuper);
                }
            });
        }
        catch (error: any) {
            console.error(error.message);
            console.error(error.stack)
            process.exit(1)
        }
        return this.fmxRep;
    }

    /**
     * Creates a File Anchor for a FAMIX element
     */
    private makeFamixIndexFileAnchor(filePath: string, startPos: number, endPos: number, famixElement: Famix.SourcedEntity) {
        let fmxIndexFileAnchor = new Famix.IndexedFileAnchor(this.fmxRep);
        fmxIndexFileAnchor.setFileName(filePath);
        fmxIndexFileAnchor.setStartPos(startPos);
        fmxIndexFileAnchor.setEndPos(endPos);
        if (famixElement != null) {
            fmxIndexFileAnchor.setElement(famixElement);
        }
    }
    
    /**
     * Gets Interfaces, Classes and Functions for each namespace of a set of modules
     */
    private readNamespace(currentModules: ModuleDeclaration[] | SourceFile, filePath, parentScope: Famix.Namespace = null) {

        let namespaceName: string;
        let fmxNamespace: Famix.Namespace;
        let interfacesInFile: InterfaceDeclaration[];
        let classesInFile: ClassDeclaration[];
        let functionsInFile: FunctionDeclaration[];

        // Validate if a SourceFile is provided with multiple modules
        if ((currentModules as SourceFile).getModules === undefined) {
            (currentModules as ModuleDeclaration[]).forEach(namespace => {

                namespaceName = namespace.getName();
                fmxNamespace = this.checkFamixNamespace(namespaceName, parentScope);
                classesInFile = namespace.getClasses();
                //get functions //get global var
                interfacesInFile = namespace.getInterfaces();

                console.info(`namespace: ${namespaceName}`);
                console.info(`classes: ${classesInFile.map(c => c.getName())}`);
                // console.info(`interfaces: ${interfacesInFile.map(i => i.getName())}`);

                this.makeFamixIndexFileAnchor(filePath, namespace.getStart(), namespace.getEnd(), fmxNamespace);

                if (classesInFile.length > 0) {
                    this.setClassElements(classesInFile, filePath, fmxNamespace);
                }
                if (interfacesInFile.length > 0) {
                    this.setInterfaceElements(interfacesInFile, filePath, fmxNamespace);
                }
                namespace.getFunctions().forEach(func => {
                    console.info("functions: ");
                    console.info(` > ${func.getName()}`);
                    let fmxFunction = this.createFamixFunction(func, filePath);
                    fmxNamespace.addFunctions(fmxFunction);
                });
                if (namespace.getModules().length > 0) {
                    this.readNamespace(namespace.getModules(), filePath, fmxNamespace);
                }
            });
        }
        // When no Modules are provided use default name space
        else {
            // namespaceName = "DefaultNamespace";
            // fmxNamespace = this.checkFamixNamespace(namespaceName, parentScope);
            classesInFile = (currentModules as SourceFile).getClasses();
            interfacesInFile = (currentModules as SourceFile).getInterfaces();
            functionsInFile = (currentModules as SourceFile).getFunctions();

            if (classesInFile.length || interfacesInFile.length || functionsInFile.length) {
                namespaceName = "DefaultNamespace";
                fmxNamespace = this.checkFamixNamespace(namespaceName, parentScope);
            }
            console.info(`namespace: ${namespaceName}`);
            console.info(`classes: ${classesInFile.map(c => c.getName())}`);
            //Arezoo  if there is not any classes but also it must be executed for global variables,functions,etc.

            if (classesInFile.length > 0) {
                this.setClassElements(classesInFile, filePath, fmxNamespace);
            }
            if (interfacesInFile.length > 0) {
                this.setInterfaceElements(interfacesInFile, filePath, fmxNamespace);
            }
            (currentModules as SourceFile).getFunctions().forEach(func => {
                console.info("functions: ");
                console.info(` > ${func.getName()}`);
                let fmxFunction = this.createFamixFunction(func, filePath);
                fmxNamespace.addFunctions(fmxFunction);
            });
        }
    }
    
    /**
     * Sets the Methods, Properties and Constructors of all classes in a file
     */
    private setClassElements(classesInFile: ClassDeclaration[], filePath: StandardizedFilePath, fmxNamespace: Famix.Namespace) {

        this.allClasses.push(...classesInFile);   //????????????????????
        console.info("Analyzing classes:");
        classesInFile.forEach(cls => {
            console.info(`> ${cls.getName()}`);
            let fmxClass = this.createFamixClass(cls, filePath);
            fmxNamespace.addTypes(fmxClass);
            this.extractDecorators(cls, fmxClass, filePath, fmxNamespace);

            console.info("Methods:");
            cls.getMethods().forEach(method => {
                console.info(` > ${method.getName()}`);
                let fmxMethod = this.createFamixMethod(method, filePath, fmxNamespace);
                this.extractDecorators(method, fmxMethod, filePath, fmxNamespace);
                fmxClass.addMethods(fmxMethod);
            });

            console.info("Properties:");
            cls.getProperties().forEach(prop => {
                console.info(` > ${prop.getName()}`);
                let fmxAttr = this.createFamixAttribute(prop, filePath);
                this.extractDecorators(prop, fmxAttr, filePath, fmxNamespace);
                fmxClass.addAttributes(fmxAttr);
            });

            console.info("Constructors:");
            cls.getConstructors().forEach(cstr => {
                console.info(` > ${cstr.getSignature().getDeclaration().getText().split("\n")[0].trim()} ...`);
                let fmxMethod = this.createFamixMethod(cstr, filePath, fmxNamespace, false, true);
                fmxClass.addMethods(fmxMethod);
            });

            console.info("Getters:");
            cls.getGetAccessors().forEach(getter => {
                console.info(` > ${getter.getName()}`);
                let fmxGetter = this.createFamixAccessor(getter, filePath);
                this.extractDecorators(getter, fmxGetter, filePath, fmxNamespace);
                fmxClass.addAccessors(fmxGetter);
            });

            console.info("Setters:");
            cls.getSetAccessors().forEach(setter => {
                console.info(` > ${setter.getName()}`);
                let fmxGetter = this.createFamixAccessor(setter, filePath);
                this.extractDecorators(setter, fmxGetter, filePath, fmxNamespace);
                fmxClass.addAccessors(fmxGetter);
            });
        });
    }

    /**
     * Sets the Methods and Properties of all interfaces in a file
     */
    private setInterfaceElements(interfacesInFile: InterfaceDeclaration[], filePath: StandardizedFilePath, fmxNamespace: Famix.Namespace) {

        this.allInterfaces.push(...interfacesInFile);
        console.info("Analyzing interfaces:");
        interfacesInFile.forEach(inter => {
            console.info(`> ${inter.getName()}`);
            let fmxInterface = this.createFamixClass(inter, filePath, true);
            fmxNamespace.addTypes(fmxInterface);

            console.info("Methods:");
            inter.getMethods().forEach(method => {
                console.info(` > ${method.getName()}`);
                let fmxMethod = this.createFamixMethod(method, filePath, fmxNamespace, true);
                fmxInterface.addMethods(fmxMethod);
            });

            console.info("Properties:");
            inter.getProperties().forEach(prop => {
                console.info(` > ${prop.getName()}`);
                let fmxAttr = this.createFamixAttribute(prop, filePath, true);
                fmxInterface.addAttributes(fmxAttr);
            });
        });
    }
    
    /**
     * Checks if a Famix namespace is set if not the method sets it (used in readNamepsace())
     */
    private checkFamixNamespace(namespaceName: string, parentScope: Famix.Namespace = null): Famix.Namespace {

        let fmxNamespace: Famix.Namespace;
        if (!this.fmxNamespacesMap.has(namespaceName)) {
            fmxNamespace = new Famix.Namespace(this.fmxRep);
            fmxNamespace.setName(namespaceName);
            if (parentScope != null) {
                fmxNamespace.setParentScope(parentScope);
            }
            this.fmxNamespacesMap[namespaceName] = fmxNamespace;
        }
        else {
            fmxNamespace = this.fmxNamespacesMap[namespaceName];
        }

        return fmxNamespace;
    }

    /**
     * Make a Famix class for a Class or an Interface
     */
    private createFamixClass(cls: ClassDeclaration | InterfaceDeclaration, filePath, isInterface = false): Famix.Class {
        let fmxClass = new Famix.Class(this.fmxRep);
        let clsName = cls.getName();
        fmxClass.setName(clsName);
        fmxClass.setIsInterface(isInterface);

        this.makeFamixIndexFileAnchor(filePath, cls.getStart(), cls.getEnd(), fmxClass);

        this.fmxTypes.set(clsName, fmxClass);
        return fmxClass;
    }

    /**
     * Make a Famix method for a Method or a Constructor
     */
    private createFamixMethod(
		method: MethodDeclaration | ConstructorDeclaration | MethodSignature, 
		filePath: StandardizedFilePath,
		fmxNamespace: Famix.Namespace, 
		isSignature: boolean = false, 
		isConstructor: boolean = false,
	): Famix.Method {

        let fmxMethod = new Famix.Method(this.fmxRep);
        if (isConstructor) {
            fmxMethod.setName("constructor");
        }
        else if (isSignature) {
            let methodName = (method as MethodSignature).getName();
            fmxMethod.setName(methodName);
        }
        else {
            //Arezoo
            let methodName = (method as MethodDeclaration).getName();
            fmxMethod.setName(methodName);
            // fmxMethod.addModifiers(this.getAccessor(method));
            ////
            //for access
            this.arrayOfInvocation.set(fmxMethod.id, method);
            ///
        }

        if (!isSignature) {//////////////////
            // let MethodeCyclo = 1;
            // (method as MethodDeclaration).getStatements().forEach(stmt => {
            //     if ([SyntaxKind.IfStatement, SyntaxKind.WhileStatement, SyntaxKind.ForStatement, SyntaxKind.DoStatement]
            //         .includes(stmt.getKind())) {
            //         MethodeCyclo++;
            //     }
            // });

            fmxMethod.setCyclomaticComplexity(this.currentCC[fmxMethod.getName()]);
        }


        let methodTypeName = this.getUsableName(method.getReturnType().getText());
        let fmxType = this.getFamixType(methodTypeName);
        fmxMethod.setDeclaredType(fmxType);
        fmxMethod.setKind(method.getKindName());
        fmxMethod.setNumberOfLinesOfCode(method.getEndLineNumber() - method.getStartLineNumber());
        fmxMethod.setFullyQualifiedName(method.getSymbol().getFullyQualifiedName());
        this.makeFamixIndexFileAnchor(filePath, method.getStart(), method.getEnd(), fmxMethod);

        //Parameters
        let parameters = method.getParameters();
        if (parameters.length > 0) {
            parameters.forEach(param => {
                let fmxParam = new Famix.Parameter(this.fmxRep);
                let paramTypeName = this.getUsableName(param.getType().getText());
                fmxParam.setDeclaredType(this.getFamixType(paramTypeName));
                fmxParam.setName(param.getName());
                this.extractDecorators(param, fmxParam, filePath, fmxNamespace);

                fmxMethod.addParameters(fmxParam);
                this.makeFamixIndexFileAnchor(filePath, param.getStart(), param.getEnd(), fmxParam);
                if (!isSignature) {
                    //for access
                    console.log(`  Add parameter for eventual access> ${param.getText()} with ${fmxParam.id}`);
                    this.arrayOfAccess.set(fmxParam.id, param);
                }
            });
        }
        fmxMethod.setNumberOfParameters(parameters.length);//Arezoo

        //Arezoo
        //Variables
        if (!isSignature) {
            method = method as MethodDeclaration;
            let variables = method.getVariableDeclarations();
            if (variables.length > 0) {
                console.info(`  Variables:`);

                variables.forEach(variable => {
                    let fullyQualifiedLocalVarName = `${method.getSymbol().getFullyQualifiedName()}().${variable.getSymbol().getFullyQualifiedName()}`;
                    console.info(`  > ${fullyQualifiedLocalVarName}`);

                    let fmxLocalVariable = new Famix.LocalVariable(this.fmxRep);
                    let localVariableTypeName = this.getUsableName(variable.getType().getText());
                    fmxLocalVariable.setDeclaredType(this.getFamixType(localVariableTypeName));
                    fmxLocalVariable.setName(variable.getName());
                    fmxMethod.addLocalVariables(fmxLocalVariable);
                    this.makeFamixIndexFileAnchor(filePath, variable.getStart(), variable.getEnd(), fmxLocalVariable);
                    //var cf = variable.getSourceFile().getSymbol().getFullyQualifiedName();
                    //for access
                    console.log(`    Add local variable for eventual access> ${variable.getText()} with ${fmxLocalVariable.id}`);
                    this.arrayOfAccess.set(fmxLocalVariable.id, variable);
                });
            }
            fmxMethod.setNumberOfStatements(method.getStatements().length);
        }
        
        return fmxMethod;
    }

    /**
     * Make a Famix function for a Function (including Parameters and local Variables)
     */
    private createFamixFunction(func: FunctionDeclaration, filePath): Famix.Function {
        console.log(` creating a FamixFunction:`);
        let fmxFunction = new Famix.Function(this.fmxRep);
        fmxFunction.setName(func.getName());

        let functionTypeName = this.getUsableName(func.getReturnType().getText());
        let fmxType = this.getFamixType(functionTypeName);
        fmxFunction.setDeclaredType(fmxType);
        fmxFunction.setNumberOfLinesOfCode(func.getEndLineNumber() - func.getStartLineNumber());
        fmxFunction.setFullyQualifiedName(func.getSymbol().getFullyQualifiedName());

        this.makeFamixIndexFileAnchor(filePath, func.getStart(), func.getEnd(), fmxFunction);

        // Get the contained Parameters
        let parameters = func.getParameters();
        if (parameters.length > 0) {
            parameters.forEach(param => {
                let fmxParam = new Famix.Parameter(this.fmxRep);
                let paramTypeName = this.getUsableName(param.getType().getText());
                fmxParam.setDeclaredType(this.getFamixType(paramTypeName));
                fmxParam.setName(param.getName());
                fmxFunction.addParameters(fmxParam);
                this.makeFamixIndexFileAnchor(filePath, param.getStart(), param.getEnd(), fmxParam);
                //for access
                console.log(`  Add parameter for eventual access> ${param.getText()} with ${fmxParam.id}`);
                this.arrayOfAccess.set(fmxParam.id, param);
            });
        }
        fmxFunction.setNumberOfParameters(parameters.length);

        // Get the contained Variables
        let variables = func.getVariableDeclarations();
        if (variables.length > 0) {
            console.info(`  Variables:`);

            variables.forEach(variable => {
                let fullyQualifiedLocalVarName = `${func.getSymbol().getFullyQualifiedName()}().${variable.getSymbol().getFullyQualifiedName()}`;
                console.info(`  > ${fullyQualifiedLocalVarName}`);

                let fmxLocalVariable = new Famix.LocalVariable(this.fmxRep);
                let localVariableTypeName = this.getUsableName(variable.getType().getText());
                fmxLocalVariable.setDeclaredType(this.getFamixType(localVariableTypeName));
                fmxLocalVariable.setName(variable.getName());
                fmxFunction.addLocalVariables(fmxLocalVariable);
                this.makeFamixIndexFileAnchor(filePath, variable.getStart(), variable.getEnd(), fmxLocalVariable);
                //for access
                console.log(`  Add local variable for eventual access> ${variable.getText()} with ${fmxLocalVariable.id}`);
                this.arrayOfAccess.set(fmxLocalVariable.id, variable);
            });
        }
        fmxFunction.setNumberOfStatements(func.getStatements().length);

        return fmxFunction;
    }

    /**
     * Create a Famix Attribute for the class Property of a class or of an interface
     */
    private createFamixAttribute(property: PropertyDeclaration | PropertySignature, filePath, isSignature = false): Famix.Attribute {

        let fmxAttribute = new Famix.Attribute(this.fmxRep);
        fmxAttribute.setName(property.getName());

        let propTypeName = property.getType().getText();
        let fmxType = this.getFamixType(propTypeName);
        fmxAttribute.setDeclaredType(fmxType);
        fmxAttribute.setHasClassScope(true);
        // fmxAttribute.addModifiers(this.getAccessor(property));
        this.makeFamixIndexFileAnchor(filePath, property.getStart(), property.getEnd(), fmxAttribute);

        if (!isSignature) {
            //for access
            console.log(`  Add property for eventual access> ${property.getText()} with ${fmxAttribute.id}`);
            this.arrayOfAccess.set(fmxAttribute.id, property);
        }
        return fmxAttribute;
    }

    /**
     * Extract the Usable Name from a `getType().getText()` call
     */
    private getUsableName(name: string): string {
        console.log(`getUsableName: ${name}`);
        if (name.includes('<')) {
            name = name.substring(0, name.indexOf('<'));
            console.log(` changed to: ${name}`);
        }
        if (name.includes('.')) {
            name = name.substring(name.lastIndexOf('.') + 1);
            console.log(` changed to: ${name}`);
        }

        return name;
    }

    /**
     * Accessor for the Famix type from a provided name string
     */
    private getFamixType(typeName: string): Famix.Type {
        let fmxType: Famix.Type;
        if (!this.fmxTypes.has(typeName)) {
            fmxType = new Famix.Type(this.fmxRep);
            fmxType.setName(typeName);
            this.fmxTypes.set(typeName, fmxType);
        }
        else {
            fmxType = this.fmxTypes.get(typeName);
        }
        return fmxType;
    }

    private createFamixAccessor(
        accessor: GetAccessorDeclaration | SetAccessorDeclaration,
        filePath: StandardizedFilePath
    ){
        // Initialize Famix entities
        let fmxAccess = new Famix.Access(this.fmxRep);
        let fmxAccessor = new Famix.BehaviouralEntity(this.fmxRep);

        // Set accessor behavioural entity properties
        fmxAccessor.setName(accessor.getName());

        // Set access entity properties
        fmxAccess.setAccessor(fmxAccessor);

        this.makeFamixIndexFileAnchor(filePath, accessor.getStart(), accessor.getEnd(), fmxAccess);
        return fmxAccess;
    } 
    
    /**
     * Extracts decorators from decorateable declarations and creates famix entities for them
     */
    private extractDecorators(
        instance: ClassDeclaration | MethodDeclaration | PropertyDeclaration | ParameterDeclaration | GetAccessorDeclaration | SetAccessorDeclaration,
        fmxEntity: Famix.Decorateable,
        filePath: StandardizedFilePath,
		fmxNamespace: Famix.Namespace
    ) {
        console.info(`Extracting decorators:`);
        instance.getDecorators().forEach(decorator => {
			let decoratorType = instance.constructor.name.replace('Declaration','');
			let isFactory = decorator.isDecoratorFactory();

            console.info(` > @${decorator.getName()}()`);
            console.info(`  ~ type: ${decoratorType} Decorator`);
            console.info(`  ~ factory: ${isFactory}`);
            console.info(`  ~ arguments: ${
                decorator
                    .getArguments()
                    .reduce((acc, val) => { return acc.concat(`${val.getText()}, `)}, '')
            }`);

            let fmxDecorator = this.createFamixDecorator(decorator, decoratorType, fmxEntity, filePath, isFactory);
			fmxNamespace.addDecorators(fmxDecorator);
        });
    }

    /**
     * Make a Famix Annotation to represent a Typescript decorator
     */
    private createFamixDecorator(
		decorator: Decorator, 
		decoratorType: string,
		decoratedEntity: Famix.Decorateable,
		filePath: StandardizedFilePath, 
		isFactory: boolean
	){
    	let fmxDecorator = new Famix.Decorator(this.fmxRep);

		// Set the decorators properties
    	fmxDecorator.setName(decorator.getName());
		fmxDecorator.setDecoratorType(decoratorType);
		fmxDecorator.setDecoratedEntity(decoratedEntity);
		fmxDecorator.setIsFactory(isFactory);

    	// Add decorator arguments as parameters
    	decorator.getArguments().forEach(param => {
    	    let fmxDecoratorParam = new Famix.Parameter(this.fmxRep);
		    fmxDecoratorParam.setParentBehaviouralEntity(fmxDecorator);
			
			fmxDecoratorParam.setName(param.getText());
			fmxDecorator.addParameters(fmxDecoratorParam);
			this.makeFamixIndexFileAnchor(filePath, param.getStart(), param.getEnd(), fmxDecoratorParam);
		});
	
    	this.makeFamixIndexFileAnchor(filePath, decorator.getStart(), decorator.getEnd(), fmxDecorator);
    	return fmxDecorator;
    }
}
