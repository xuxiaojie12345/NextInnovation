/// <reference types="react-scripts" />
//typescript
declare module "*.css" {
    const content: Record<string, unknown>;
    export default content;
}