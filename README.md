# FamixTypeScriptImporter

[![Node.js CI](https://github.com/Arezoo-Nasr/FamixTypeScriptImporter/actions/workflows/node.js.yml/badge.svg)](https://github.com/Arezoo-Nasr/FamixTypeScriptImporter/actions/workflows/node.js.yml)

## :warning: Note
This repository is a clone of the FamixTypeScript importer created by user Arezoo-Nasr. It adds decorator parsing and exporting.

## 🔗 Related Repositories
- [FamixTypeScript](https://github.com/VinceDeslo/FamixTypeScript) : The metamodel implementation for Decorators.
- [FamixTypeScriptMoose](https://github.com/VinceDeslo/FamixTypeScriptMoose) : The Moose package for counting and identifying Decorators.


## ➕ Additions to the source repo

Some changes were brought to add the processing of [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html):

- A hand written `Famix.Decorator` entity and `Famix.Decorateable` type.
- Some new ts2famix methods called `extractDecorators` and `createFamixDecorator`
- Unit tests to cover the five types of decorators (class, method, accessor, property, and parameter)
- A `parse.sh` script to parse multiple files from a directory.


## Purpose

Create a FAMIX model in JSON of TypeScript files. The JSON model is stored in the JSONModels folder.


## Installation

```
npm install
```

```
npm install -g ts-node
```


## Usage

Instructions for using the command-line importer:

```
ts-node src/ts2famix-cli.ts --help
```


## Bulk parsing script

To use the bulk parsing script, a repo must be located in the same directory as the current project.  
Here is an example of usage with the [Nest](https://github.com/nestjs/nest) project:  

```bash
# from FamixTypeScriptImporter root
./parse.sh
# When prompted with "Input the root folder of the project to analyse:"
../nest/sample
# When prompted with "Input the wanted JSONModels directory name:"
nest
```

The parser will be run on all TypeScript files within the `nest/sample` directory.  
Output will be generated into `JSONModels/nest`.    


## Single file parsing

To parse a single file, here is an example flow with the same project as the bulk script above:

```bash
# from FamixTypeScriptImporter root
ts-node src/ts2famix-cli.ts -i ../nest/sample/01-cats-app/src/cats/cats.controller.ts -o JSONModels/Cats.json
```


## Generate an object diagram of the JSON model

```
ts-node src/famix2puml.ts -i JSONModels/ModelName.json -o ModelName.puml
```


## Import the JSON into the Moose

```
'.\JSONModels\TypeScriptModel.json' asFileReference readStreamDo:
[ :stream | model := FamixTypeScriptModel new importFromJSONStream: stream. model install ].
```


## Sample projects used to generate the JSONModels:

The following projects contain examples of code containing decorators.

- [alosaur](https://github.com/alosaur/alosaur/tree/master/examples)
- [class-transformer](https://github.com/typestack/class-transformer/tree/develop/sample)
- [class-validator](https://github.com/typestack/class-validator/tree/develop/sample)
- [loopback-next](https://github.com/loopbackio/loopback-next/tree/master/examples)
- [nest](https://github.com/nestjs/nest/tree/master/sample)
- [routing-controllers](https://github.com/typestack/routing-controllers/tree/develop/sample)
- [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript/tree/master/examples)
- [type-graphql](https://github.com/MichalLytek/type-graphql/tree/master/examples)
- [typeorm](https://github.com/typeorm/typeorm/tree/master/sample)
