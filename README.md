# Make Me Cross - A Crossword Building app

This repository contains the code for https://makemecross.com/

## Getting Started

```
// in root directory
// run backend
pnpm run dev
```
in separate terminal:
```
// run frontend
cd packages/frontend/
pnpm run dev
```
## Deploy
```
pnpm sst deploy --stage prod
```

## Structure

```
root
├── package.json
├── packages
│   ├── core
│   ├── frontend
│   │   └── src
│   │   │   ├── components
│   │   │   ├── lib
│   │   │   └── containers
│   └── functions
├── sst.config.ts
└── stacks
    ├── ApiStack.ts
    ├── AuthStack.ts
    ├── FrontendStack.ts
    ├── StorageStack.ts
    └── test
```
