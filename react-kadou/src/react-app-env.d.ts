/// <reference types="react-scripts" />

/**
 * CSS（サイドエフェクトのみのインポート）の宣言。
 *
 * VS Code 同梱の TypeScript 6.x では、サイドエフェクトのみのインポートも
 * モジュール解決の対象になるため（noUncheckedSideEffectImports）、
 * 型宣言が無いと編集画面に次のエラーが出る。
 *   TS2882: Cannot find module or type declarations for side-effect import of './xxx.css'
 *
 * CRA が参照する react-scripts の型定義は '*.module.css' のみを宣言しており
 * 素の '*.css' は宣言していないため、ここで補う。
 * （プロジェクトの TypeScript 4.9.5 / CRA のビルドではエラーにならない）
 */
declare module '*.css';

